import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}
interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  tags?: string;
  extraInfo?: ExtraInfo[];
}

interface Request {
  contactData: ContactData;
  contactId: string;
}

const UpdateContactService = async ({
  contactData,
  contactId
}: Request): Promise<Contact> => {
  const { email, name, number, tags, extraInfo } = contactData;

  const contact = await Contact.findOne({
    where: { id: contactId },
    attributes: ["id", "name", "number", "email", "profilePicUrl", "tags", "tenantId"],
    include: ["extraInfo"]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (extraInfo) {
    await Promise.all(
      extraInfo.map(async info => {
        await ContactCustomField.upsert({ ...info, contactId: contact.id });
      })
    );

    await Promise.all(
      contact.extraInfo.map(async oldInfo => {
        const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

        if (stillExists === -1) {
          await ContactCustomField.destroy({ where: { id: oldInfo.id } });
        }
      })
    );
  }

  await contact.update({
    name,
    number,
    email,
    tags
  });

  // Sincronizar etiquetas com o celular do WhatsApp
  if (tags !== undefined) {
    try {
      const Whatsapp = require("../../models/Whatsapp").default;
      const whatsapps = await Whatsapp.findAll({
        where: { tenantId: contact.tenantId, status: "CONNECTED" }
      });
      const { whatsappProvider } = require("../../providers/WhatsApp");
      const tagNames = tags ? tags.split(",").map((t: string) => t.trim()) : [];
      
      for (const w of whatsapps) {
        if (typeof whatsappProvider.updateChatLabels === "function") {
          await whatsappProvider.updateChatLabels(w.id, contact.number, tagNames).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error("Error triggering label sync from panel:", err.message);
    }
  }

  await contact.reload({
    attributes: ["id", "name", "number", "email", "profilePicUrl", "tags", "tenantId"],
    include: ["extraInfo"]
  });

  return contact;
};

export default UpdateContactService;
