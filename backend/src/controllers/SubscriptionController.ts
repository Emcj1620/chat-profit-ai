import { Request, Response } from "express";
import https from "https";
import Tenant from "../models/Tenant";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import { getPlanById } from "../config/plans";
import CheckSettings from "../helpers/CheckSettings";
import { getIO } from "../libs/socket";

// Helper for Asaas Requests
const asaasRequest = (
  method: "GET" | "POST",
  path: string,
  token: string,
  data?: any
): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Determinar se estamos em produção com base no formato do token
    const isProd = token.startsWith("$aact_prod_");
    const host = isProd ? "api.asaas.com" : "sandbox.asaas.com";
    
    const options = {
      hostname: host,
      port: 443,
      path: `/v3${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "access_token": token,
        "User-Agent": "Whaticket-SaaS"
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new AppError(parsed.errors ? JSON.stringify(parsed.errors) : `HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new AppError(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  const userCount = await User.count({ where: { tenantId } });
  const connectionsCount = await Whatsapp.count({ where: { tenantId } });

  const plan = getPlanById(tenant.planId) || {
    id: 1,
    name: "Trial",
    price: 0,
    maxUsers: 3,
    maxConnections: 1
  };

  return res.status(200).json({
    id: tenant.id,
    name: tenant.name,
    subscriptionStatus: tenant.subscriptionStatus,
    dueDate: tenant.dueDate,
    maxUsers: tenant.maxUsers,
    maxConnections: tenant.maxConnections,
    planId: tenant.planId,
    planName: plan.name,
    planPrice: plan.price,
    usage: {
      users: userCount,
      connections: connectionsCount
    }
  });
};

export const createPayment = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { planId, paymentMethod, installmentCount, installmentValue, billingInfo, creditCard } = req.body;

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  const plan = getPlanById(planId);
  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  // Obter credenciais globais do Asaas no Master Tenant (Tenant 1)
  const asaasToken = await CheckSettings("asaasToken", 1).catch(() => "");
  
  if (!asaasToken) {
    throw new AppError("ERR_ASAAS_GATEWAY_NOT_CONFIGURED", 400);
  }

  if (!billingInfo || !billingInfo.cpfCnpj) {
    throw new AppError("ERR_CPF_CNPJ_REQUIRED", 400);
  }

  try {
    // 1. Obter ou Criar/Atualizar Cliente no Asaas
    let asaasCustomerId = tenant.asaasCustomerId;
    if (!asaasCustomerId) {
      const customer = await asaasRequest("POST", "/customers", asaasToken, {
        name: billingInfo.name,
        email: billingInfo.email,
        cpfCnpj: billingInfo.cpfCnpj,
        mobilePhone: billingInfo.phone,
        notificationDisabled: true
      });
      asaasCustomerId = customer.id;
      await tenant.update({ asaasCustomerId });
    } else {
      // Atualizar dados para certificar que o CPF/CNPJ e Telefone estejam corretos
      await asaasRequest("POST", `/customers/${asaasCustomerId}`, asaasToken, {
        name: billingInfo.name,
        email: billingInfo.email,
        cpfCnpj: billingInfo.cpfCnpj,
        mobilePhone: billingInfo.phone
      }).catch(err => console.error("Error updating customer in Asaas:", err));
    }

    // 2. Definir vencimento (amanhã para cobranças imediatas)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().split("T")[0];

    const payload: any = {
      customer: asaasCustomerId,
      dueDate: dueDateStr,
      description: `Assinatura Plano ${plan.name} - ${tenant.name}`,
      externalReference: plan.id.toString(), // Salva a ID do plano como referência externa para o Webhook
      postalService: false
    };

    if (paymentMethod === "credit_card") {
      payload.billingType = "CREDIT_CARD";
      
      if (installmentCount && installmentCount > 1) {
        payload.installmentCount = installmentCount;
        payload.value = installmentValue;
      } else {
        payload.value = plan.price;
      }

      // Adicionar dados do cartão e informações do titular exigidas pelo Asaas
      payload.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv
      };

      payload.creditCardHolderInfo = {
        name: billingInfo.name,
        email: billingInfo.email,
        cpfCnpj: billingInfo.cpfCnpj,
        postalCode: billingInfo.postalCode || "01001000",
        addressNumber: billingInfo.addressNumber || "123",
        phone: billingInfo.phone
      };
    } else {
      payload.billingType = "PIX";
      payload.value = plan.price;
    }

    const paymentResponse = await asaasRequest("POST", "/payments", asaasToken, payload);

    const paymentId = paymentResponse.id;
    const invoiceUrl = paymentResponse.invoiceUrl || paymentResponse.bankInvoiceUrl;

    // Se o pagamento no cartão for confirmado imediatamente, ativamos a assinatura na hora!
    if (paymentMethod === "credit_card" && (paymentResponse.status === "RECEIVED" || paymentResponse.status === "CONFIRMED")) {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);

      await tenant.update({
        subscriptionStatus: "active",
        dueDate: newDueDate,
        planId: plan.id,
        maxUsers: plan.maxUsers,
        maxConnections: plan.maxConnections
      });

      // Notificar frontend via WebSocket
      const io = getIO();
      io.emit("subscription", {
        action: "update",
        tenantId: tenant.id,
        subscriptionStatus: "active",
        dueDate: newDueDate,
        maxUsers: plan.maxUsers,
        maxConnections: plan.maxConnections
      });
    }

    // 3. Se for PIX direto, buscamos o QR Code e o Copia e Cola para renderizar na tela
    if (paymentMethod === "pix") {
      const pixQrDetails = await asaasRequest("GET", `/payments/${paymentId}/pixQrCode`, asaasToken);
      
      return res.status(200).json({
        paymentId,
        paymentMethod,
        planId,
        price: plan.price,
        invoiceUrl,
        pixCode: pixQrDetails.payload,
        qrCode: `data:image/png;base64,${pixQrDetails.encodedImage}`
      });
    }

    // Retorna dados do cartão e confirmação de pagamento
    return res.status(200).json({
      paymentId,
      paymentMethod,
      planId,
      price: plan.price,
      invoiceUrl,
      status: paymentResponse.status
    });
  } catch (err) {
    console.error("Asaas payment error:", err);
    throw new AppError(err.message || "Failed to process Asaas payment");
  }
};

// Simulated Payment Confirmation (Development / Evaluation Mode helper)
export const simulatePayment = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { planId } = req.body;

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  const plan = getPlanById(planId);
  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  // Extend due date by 30 days and update limits based on plan
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + 30);

  await tenant.update({
    subscriptionStatus: "active",
    dueDate: newDueDate,
    planId: plan.id,
    maxUsers: plan.maxUsers,
    maxConnections: plan.maxConnections
  });

  // Notify frontend via WebSocket of updated subscription limits/status
  const io = getIO();
  io.emit("subscription", {
    action: "update",
    tenantId: tenant.id,
    subscriptionStatus: "active",
    dueDate: newDueDate,
    maxUsers: plan.maxUsers,
    maxConnections: plan.maxConnections
  });

  return res.status(200).json({
    success: true,
    message: "Subscription successfully updated via Mock Simulator!",
    tenant
  });
};

// Webhook for Asaas Payment Gateways
export const webhookAsaas = async (req: Request, res: Response): Promise<Response> => {
  const { event, payment } = req.body;

  // We check if payment is received/confirmed
  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    const { customer, externalReference } = payment;

    // Encontra o inquilino com base no ID de cliente do Asaas
    const tenant = await Tenant.findOne({
      where: { asaasCustomerId: customer }
    });

    if (tenant) {
      // Carrega o plano pago (com base no externalReference enviado na criação da cobrança)
      const planId = externalReference ? parseInt(externalReference) : tenant.planId;
      const plan = getPlanById(planId) || getPlanById(2); // fallback para o Prata

      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);

      await tenant.update({
        subscriptionStatus: "active",
        dueDate: newDueDate,
        planId: plan ? plan.id : tenant.planId,
        maxUsers: plan ? plan.maxUsers : 10,
        maxConnections: plan ? plan.maxConnections : 3
      });

      // Notifica o frontend em tempo real via WebSocket
      const io = getIO();
      io.emit("subscription", {
        action: "update",
        tenantId: tenant.id,
        subscriptionStatus: "active",
        dueDate: newDueDate,
        maxUsers: plan ? plan.maxUsers : 10,
        maxConnections: plan ? plan.maxConnections : 3
      });
    }
  }

  return res.status(200).json({ received: true });
};

// Webhook for Stripe Payment Gateways
export const webhookStripe = async (req: Request, res: Response): Promise<Response> => {
  const { type, data } = req.body;

  if (type === "checkout.session.completed" || type === "invoice.payment_succeeded") {
    const session = data.object;
    const customerId = session.customer;

    // Find tenant matching stripeCustomerId
    const tenant = await Tenant.findOne({
      where: { stripeCustomerId: customerId }
    });

    if (tenant) {
      const plan = getPlanById(tenant.planId) || getPlanById(2);

      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);

      await tenant.update({
        subscriptionStatus: "active",
        dueDate: newDueDate,
        maxUsers: plan ? plan.maxUsers : 10,
        maxConnections: plan ? plan.maxConnections : 3
      });

      const io = getIO();
      io.emit("subscription", {
        action: "update",
        tenantId: tenant.id,
        subscriptionStatus: "active",
        dueDate: newDueDate
      });
    }
  }

  return res.status(200).json({ received: true });
};
