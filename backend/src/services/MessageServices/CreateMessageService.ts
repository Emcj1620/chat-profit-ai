import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  quotedMsgId?: string;
}
interface Request {
  messageData: MessageData;
}

const CreateMessageService = async ({
  messageData
}: Request): Promise<Message> => {
  await Message.upsert(messageData);

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          "contact",
          "queue",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["name"]
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  // Trigger Webhook async para mensagens recebidas
  if (!message.fromMe) {
    const tenantId = message.ticket.tenantId;
    import("../WebhookServices/DispatchWebhook")
      .then(({ DispatchWebhook }) => {
        DispatchWebhook(tenantId, "message_received", {
          messageId: message.id,
          body: message.body,
          mediaType: message.mediaType,
          mediaUrl: message.mediaUrl,
          contact: {
            id: message.contact?.id,
            name: message.contact?.name,
            number: message.contact?.number
          },
          ticketId: message.ticketId
        });
      })
      .catch((err) => console.error("Error triggering webhook async:", err.message));
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit("appMessage", {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  return message;
};

export default CreateMessageService;
