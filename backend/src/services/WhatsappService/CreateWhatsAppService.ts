import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import Tenant from "../../models/Tenant";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";

interface Request {
  name: string;
  queueIds?: number[];
  greetingMessage?: string;
  farewellMessage?: string;
  status?: string;
  isDefault?: boolean;
  tenantId?: number;
  gptEnabled?: boolean;
  gptApiKey?: string;
  gptModel?: string;
  gptPrompt?: string;
  gptGuidelines?: string;
  gptTemperature?: number;
  flowId?: number;
  typebotEnabled?: boolean;
  typebotUrl?: string;
  typebotName?: string;
  typebotViewerId?: string;
  n8nEnabled?: boolean;
  n8nUrl?: string;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const CreateWhatsAppService = async ({
  name,
  status = "OPENING",
  queueIds = [],
  greetingMessage,
  farewellMessage,
  isDefault = false,
  tenantId,
  gptEnabled = false,
  gptApiKey,
  gptModel = "gpt-4o-mini",
  gptPrompt,
  gptGuidelines,
  gptTemperature = 0.7,
  flowId,
  typebotEnabled = false,
  typebotUrl,
  typebotName,
  typebotViewerId,
  n8nEnabled = false,
  n8nUrl
}: Request): Promise<Response> => {
  if (tenantId) {
    const tenant = await Tenant.findByPk(tenantId);
    if (tenant && tenant.maxConnections !== -1) {
      const connectionsCount = await Whatsapp.count({ where: { tenantId } });
      if (connectionsCount >= tenant.maxConnections) {
        throw new AppError("ERR_CONNECTION_LIMIT_EXCEEDED", 400);
      }
    }
  }

  const schema = Yup.object().shape({
    name: Yup.string()
      .required()
      .min(2)
      .test(
        "Check-name",
        "This whatsapp name is already used.",
        async value => {
          if (!value) return false;
          const nameExists = await Whatsapp.findOne({
            where: { name: value, ...(tenantId ? { tenantId } : {}) }
          });
          return !nameExists;
        }
      ),
    isDefault: Yup.boolean().required()
  });

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsappFound = await Whatsapp.findOne();

  isDefault = !whatsappFound;

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { 
        isDefault: true, 
        ...(tenantId ? { tenantId } : {}) 
      }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  const whatsapp = await Whatsapp.create(
    {
      name,
      status,
      greetingMessage,
      farewellMessage,
      isDefault,
      tenantId,
      gptEnabled,
      gptApiKey,
      gptModel,
      gptPrompt,
      gptGuidelines,
      gptTemperature,
      flowId,
      typebotEnabled,
      typebotUrl,
      typebotName,
      typebotViewerId,
      n8nEnabled,
      n8nUrl
    },
    { include: ["queues"] }
  );

  await AssociateWhatsappQueue(whatsapp, queueIds);

  return { whatsapp, oldDefaultWhatsapp };
};

export default CreateWhatsAppService;
