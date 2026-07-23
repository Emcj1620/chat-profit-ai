import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import ShowContactService from "../ContactServices/ShowContactService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  queueId?: number;
  tenantId: number;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  tenantId
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(userId, tenantId);

  await CheckContactOpenTickets(contactId, defaultWhatsapp.id);

  const { isGroup } = await ShowContactService(contactId);

  if (queueId === undefined) {
    const user = await User.findByPk(userId, { include: ["queues"] });
    queueId = user?.queues.length === 1 ? user.queues[0].id : undefined;
  }

  const ticket = await Ticket.create({
    contactId,
    status,
    isGroup,
    userId,
    queueId,
    whatsappId: defaultWhatsapp.id,
    tenantId
  });

  const showTicket = await Ticket.findByPk(ticket.id, { include: ["contact"] });

  if (!showTicket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  return showTicket;
};

export default CreateTicketService;
