import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import openSocket from "../../services/socket-io";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(4),
    fontWeight: "bold",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "visible",
  },
  cardHeader: {
    backgroundColor: theme.palette.type === "light" ? theme.palette.grey[200] : theme.palette.grey[800],
    padding: theme.spacing(2),
    textAlign: "center",
  },
  cardContent: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  price: {
    fontSize: "2rem",
    fontWeight: "bold",
    textAlign: "center",
    margin: theme.spacing(2, 0),
  },
  bulletList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    "& li": {
      padding: theme.spacing(1, 0),
      borderBottom: `1px solid ${theme.palette.divider}`,
      textAlign: "center",
    }
  },
  detailsPaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  usageLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  progress: {
    height: 10,
    borderRadius: 5,
    marginBottom: theme.spacing(2),
  },
  paymentPaper: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(4),
    textAlign: "center",
  },
  qrCodeImg: {
    maxWidth: 200,
    margin: theme.spacing(2, "auto"),
    display: "block",
  },
  copyField: {
    marginBottom: theme.spacing(2),
  }
}));

const interestTable = {
  1: 1.000,
  2: 1.039,
  3: 1.054,
  4: 1.069,
  5: 1.084,
  6: 1.099,
  7: 1.119,
  8: 1.134,
  9: 1.149,
  10: 1.164,
  11: 1.179,
  12: 1.194
};

const getInstallmentOptions = (price) => {
  const options = [];
  const anticipationRate = 1.016; // 1.6% anticipation fee repasse
  for (let n = 1; n <= 12; n++) {
    const multiplier = interestTable[n];
    const total = price * multiplier * anticipationRate;
    const value = total / n;
    options.push({
      count: n,
      value: Number(value.toFixed(2)),
      total: Number(total.toFixed(2)),
      interest: n > 1
    });
  }
  return options;
};

const Subscription = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState("pix");
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    email: "",
    cpfCnpj: "",
    phone: "",
    postalCode: "",
    addressNumber: ""
  });
  const [creditCard, setCreditCard] = useState({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: ""
  });
  const [targetPlanId, setTargetPlanId] = useState(null);
  const [targetInstallmentCount, setTargetInstallmentCount] = useState(1);
  const [targetInstallmentValue, setTargetInstallmentValue] = useState(0);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/subscription");
      setSubInfo(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (user) {
      setBillingInfo(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    const socket = openSocket();
    socket.on("subscription", data => {
      if (data.action === "update") {
        toast.info("Assinatura atualizada em tempo real!");
        fetchSubscription();
        setPaymentData(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSelectPlan = async (planId, paymentMethod, installmentCount, installmentValue) => {
    setTargetPlanId(planId);
    setPaymentType(paymentMethod);
    setTargetInstallmentCount(installmentCount || 1);
    setTargetInstallmentValue(installmentValue || 0);
    setFormDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!billingInfo.name || !billingInfo.email || !billingInfo.cpfCnpj || !billingInfo.phone) {
      toast.error("Por favor, preencha todos os dados obrigatórios do cliente.");
      return;
    }
    if (paymentType === "credit_card" && (!creditCard.holderName || !creditCard.number || !creditCard.expiryMonth || !creditCard.expiryYear || !creditCard.ccv)) {
      toast.error("Por favor, preencha todos os dados do cartão de crédito.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/subscription/pay", {
        planId: targetPlanId,
        paymentMethod: paymentType,
        installmentCount: targetInstallmentCount,
        installmentValue: targetInstallmentValue,
        billingInfo,
        creditCard
      });

      if (paymentType === "credit_card") {
        if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
          toast.success("Pagamento aprovado com sucesso! Sua conta está ativa.");
          fetchSubscription();
        } else if (data.invoiceUrl) {
          toast.success("Redirecionando para a fatura do Asaas...");
          window.open(data.invoiceUrl, "_blank");
        }
        setPaymentData(null);
        setFormDialogOpen(false);
      } else {
        setPaymentData(data);
        setFormDialogOpen(false);
        toast.success("Pagamento via PIX gerado! Utilize os dados abaixo para simular.");
      }
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInstallments = (planId, price, name) => {
    setInstallmentPlan({ id: planId, price, name });
    setInstallmentDialogOpen(true);
  };

  const handleSimulatePayment = async () => {
    if (!selectedPlanId) return;
    try {
      const { data } = await api.post("/subscription/simulate-payment", {
        planId: selectedPlanId
      });
      toast.success(data.message || "Simulação efetuada com sucesso!");
    } catch (err) {
      toastError(err);
    }
  };

  if (loading && !subInfo) {
    return (
      <Container className={classes.root}>
        <Typography>Carregando informações financeiras...</Typography>
      </Container>
    );
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  const isExpired = subInfo?.dueDate && new Date(subInfo.dueDate) < new Date();

  return (
    <Container className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Minha Assinatura / Financeiro
      </Typography>

      {subInfo && (
        <Paper className={classes.detailsPaper} elevation={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Detalhes da Conta
              </Typography>
              <Typography variant="body1">
                <strong>Empresa:</strong> {subInfo.name}
              </Typography>
              <Typography variant="body1">
                <strong>Plano Atual:</strong> {subInfo.planName} (R$ {subInfo.planPrice?.toFixed(2)})
              </Typography>
              <Typography variant="body1" style={{ color: isExpired ? "red" : "inherit" }}>
                <strong>Vencimento:</strong> {formatDueDate(subInfo.dueDate)} {isExpired && " (EXPIRADO)"}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {subInfo.subscriptionStatus?.toUpperCase()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Uso de Limites
              </Typography>
              
              <div className={classes.usageLabel}>
                <Typography variant="body2">Atendentes / Usuários</Typography>
                <Typography variant="body2">
                  {subInfo.usage?.users} de {subInfo.maxUsers === -1 ? "Ilimitados" : subInfo.maxUsers}
                </Typography>
              </div>
              {subInfo.maxUsers !== -1 && (
                <LinearProgress 
                  variant="determinate" 
                  value={(subInfo.usage?.users / subInfo.maxUsers) * 100} 
                  className={classes.progress}
                  color={subInfo.usage?.users >= subInfo.maxUsers ? "secondary" : "primary"}
                />
              )}

              <div className={classes.usageLabel}>
                <Typography variant="body2">Conexões WhatsApp</Typography>
                <Typography variant="body2">
                  {subInfo.usage?.connections} de {subInfo.maxConnections === -1 ? "Ilimitadas" : subInfo.maxConnections}
                </Typography>
              </div>
              {subInfo.maxConnections !== -1 && (
                <LinearProgress 
                  variant="determinate" 
                  value={(subInfo.usage?.connections / subInfo.maxConnections) * 100} 
                  className={classes.progress}
                  color={subInfo.usage?.connections >= subInfo.maxConnections ? "secondary" : "primary"}
                />
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={4} justify="center">
        {/* Bronze Plan Card */}
        <Grid item xs={12} sm={4}>
          <Card className={classes.card} elevation={3}>
            <div className={classes.cardHeader}>
              <Typography variant="h5">Bronze</Typography>
            </div>
            <CardContent className={classes.cardContent}>
              <div className={classes.price}>
                R$ 49,90<Typography variant="caption">/mês</Typography>
              </div>
              <ul className={classes.bulletList}>
                <li>Até 3 Atendentes</li>
                <li>1 Conexão WhatsApp</li>
                <li>Painel Dinâmico</li>
                <li>Suporte por E-mail</li>
              </ul>
            </CardContent>
            <CardActions style={{ flexDirection: "column", gap: "8px", padding: 16 }}>
              <Button 
                fullWidth 
                variant={subInfo?.planId === 1 ? "outlined" : "contained"} 
                color="primary"
                onClick={() => handleSelectPlan(1, "pix")}
              >
                {subInfo?.planId === 1 ? "PIX (Plano Atual)" : "Pagar com PIX"}
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                onClick={() => handleOpenInstallments(1, 49.90, "Bronze")}
              >
                CARTÃO
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Prata Plan Card */}
        <Grid item xs={12} sm={4}>
          <Card className={classes.card} elevation={3} style={{ border: "2px solid #2576d2" }}>
            <div className={classes.cardHeader} style={{ backgroundColor: "#2576d2", color: "#fff" }}>
              <Typography variant="h5">Prata</Typography>
            </div>
            <CardContent className={classes.cardContent}>
              <div className={classes.price}>
                R$ 99,90<Typography variant="caption">/mês</Typography>
              </div>
              <ul className={classes.bulletList}>
                <li>Até 10 Atendentes</li>
                <li>3 Conexões WhatsApp</li>
                <li>Painel Dinâmico</li>
                <li>Suporte prioritário</li>
              </ul>
            </CardContent>
            <CardActions style={{ flexDirection: "column", gap: "8px", padding: 16 }}>
              <Button 
                fullWidth 
                variant={subInfo?.planId === 2 ? "outlined" : "contained"} 
                color="primary"
                onClick={() => handleSelectPlan(2, "pix")}
              >
                {subInfo?.planId === 2 ? "PIX (Plano Atual)" : "Pagar com PIX"}
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                onClick={() => handleOpenInstallments(2, 99.90, "Prata")}
              >
                CARTÃO
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Ouro Plan Card */}
        <Grid item xs={12} sm={4}>
          <Card className={classes.card} elevation={3}>
            <div className={classes.cardHeader}>
              <Typography variant="h5">Ouro</Typography>
            </div>
            <CardContent className={classes.cardContent}>
              <div className={classes.price}>
                R$ 199,90<Typography variant="caption">/mês</Typography>
              </div>
              <ul className={classes.bulletList}>
                <li>Atendentes Ilimitados</li>
                <li>Conexões Ilimitadas</li>
                <li>Painel Dinâmico</li>
                <li>Suporte Dedicado 24/7</li>
              </ul>
            </CardContent>
            <CardActions style={{ flexDirection: "column", gap: "8px", padding: 16 }}>
              <Button 
                fullWidth 
                variant={subInfo?.planId === 3 ? "outlined" : "contained"} 
                color="primary"
                onClick={() => handleSelectPlan(3, "pix")}
              >
                {subInfo?.planId === 3 ? "PIX (Plano Atual)" : "Pagar com PIX"}
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                onClick={() => handleOpenInstallments(3, 199.90, "Ouro")}
              >
                CARTÃO
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {paymentData && (
        <Paper className={classes.paymentPaper} elevation={3}>
          <Typography variant="h6" gutterBottom>
            Realizar Pagamento via PIX
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Escaneie o código QR abaixo ou copie e cole a chave Pix para realizar o pagamento.
          </Typography>
          
          <img src={paymentData.qrCode} alt="PIX QR Code" className={classes.qrCodeImg} />

          <TextField
            label="Chave Copia e Cola PIX"
            defaultValue={paymentData.pixCode}
            variant="outlined"
            fullWidth
            InputProps={{ readOnly: true }}
            className={classes.copyField}
          />

          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSimulatePayment}
            style={{ marginTop: 10 }}
          >
            Simular Confirmação de Pagamento
          </Button>
        </Paper>
      )}

      {installmentPlan && (
        <Dialog
          open={installmentDialogOpen}
          onClose={() => setInstallmentDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle style={{ fontWeight: "bold" }}>
            Opções de Parcelamento - {installmentPlan.name}
          </DialogTitle>
          <DialogContent dividers>
            <List>
              {getInstallmentOptions(installmentPlan.price).map((option) => (
                <ListItem
                  button
                  key={option.count}
                  onClick={() => {
                    handleSelectPlan(
                      installmentPlan.id,
                      "credit_card",
                      option.count,
                      option.value
                    );
                    setInstallmentDialogOpen(false);
                  }}
                >
                  <ListItemText
                    primary={
                      option.count === 1
                        ? `1x de R$ ${option.value.toFixed(2)} (Sem Juros)`
                        : `${option.count}x de R$ ${option.value.toFixed(2)}`
                    }
                    secondary={
                      option.count > 1
                        ? `Total: R$ ${option.total.toFixed(2)} (com juros)`
                        : `Total: R$ ${option.total.toFixed(2)}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInstallmentDialogOpen(false)} color="primary">
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: "bold" }}>
          Dados de Cobrança e Faturamento
        </DialogTitle>
        <DialogContent dividers style={{ padding: 24 }}>
          <Typography variant="subtitle1" gutterBottom style={{ fontWeight: "bold", marginBottom: 12 }}>
            Informações do Cliente
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome Completo"
                value={billingInfo.name}
                onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="E-mail"
                value={billingInfo.email}
                onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CPF ou CNPJ (apenas números)"
                value={billingInfo.cpfCnpj}
                onChange={(e) => setBillingInfo({ ...billingInfo, cpfCnpj: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefone Celular"
                value={billingInfo.phone}
                onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                placeholder="Ex: 11999999999"
                variant="outlined"
                fullWidth
                required
              />
            </Grid>
            {paymentType === "credit_card" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CEP"
                    value={billingInfo.postalCode}
                    onChange={(e) => setBillingInfo({ ...billingInfo, postalCode: e.target.value })}
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Número do Endereço"
                    value={billingInfo.addressNumber}
                    onChange={(e) => setBillingInfo({ ...billingInfo, addressNumber: e.target.value })}
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider style={{ margin: "16px 0" }} />
                  <Typography variant="subtitle1" gutterBottom style={{ fontWeight: "bold" }}>
                    Informações do Cartão de Crédito
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome Impresso no Cartão"
                    value={creditCard.holderName}
                    onChange={(e) => setCreditCard({ ...creditCard, holderName: e.target.value })}
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Número do Cartão"
                    value={creditCard.number}
                    onChange={(e) => setCreditCard({ ...creditCard, number: e.target.value })}
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Mês (MM)"
                    value={creditCard.expiryMonth}
                    onChange={(e) => setCreditCard({ ...creditCard, expiryMonth: e.target.value })}
                    placeholder="Ex: 12"
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Ano (AAAA)"
                    value={creditCard.expiryYear}
                    onChange={(e) => setCreditCard({ ...creditCard, expiryYear: e.target.value })}
                    placeholder="Ex: 2028"
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Código CVV"
                    value={creditCard.ccv}
                    onChange={(e) => setCreditCard({ ...creditCard, ccv: e.target.value })}
                    variant="outlined"
                    fullWidth
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions style={{ padding: 16 }}>
          <Button onClick={() => setFormDialogOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {paymentType === "credit_card" ? "Pagar com Cartão" : "Gerar PIX"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Subscription;
