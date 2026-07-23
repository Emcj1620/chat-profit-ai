import { Request, Response } from "express";
import ChatFlow from "../models/ChatFlow";
import Whatsapp from "../models/Whatsapp";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { RunFlow } from "../services/ChatFlowServices/FlowRunner";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

interface TriggerData {
  number: string;
  variables?: Record<string, string>;
}

export const trigger = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { number, variables = {} }: TriggerData = req.body;

  if (!number) {
    throw new AppError("Phone number is required in request body", 400);
  }

  // 1. Fetch ChatFlow to check existence and retrieve tenantId
  const chatFlow = await ChatFlow.findByPk(id);
  if (!chatFlow || !chatFlow.isActive) {
    throw new AppError("ChatFlow not found or inactive", 404);
  }

  const { tenantId } = chatFlow;

  // 2. Fetch or create the Contact record
  const cleanNumber = number.replace(/\D/g, "");
  let contact = await Contact.findOne({
    where: { number: cleanNumber, tenantId }
  });

  if (!contact) {
    contact = await Contact.create({
      name: cleanNumber,
      number: cleanNumber,
      tenantId
    });
  }

  // 3. Find default/available WhatsApp session for the tenant to run the chat through
  const whatsapp = await Whatsapp.findOne({
    where: { tenantId, status: "CONNECTED" }
  }) || await Whatsapp.findOne({
    where: { tenantId }
  });

  if (!whatsapp) {
    throw new AppError("No WhatsApp connection available for this tenant", 500);
  }

  // 4. Find or create active Ticket for the contact
  const ticket = await FindOrCreateTicketService(
    contact,
    whatsapp.id,
    0, // unread messages
    tenantId
  );

  // 5. Initialize the ChatFlow on the Ticket
  logger.info(`PublicChatFlowController: Webhook trigger starting flow ID ${chatFlow.id} for ticket ID ${ticket.id}`);
  
  await ticket.update({
    flowId: chatFlow.id,
    flowNodeId: null, // start from beginning
    flowState: JSON.stringify(variables),
    timerDelayUntil: null // reset any pending delay
  });

  // 6. Execute Flow Runner synchronously for the first node sequence
  await RunFlow(ticket);

  return res.status(200).json({
    message: "Chatbot flow triggered successfully",
    ticketId: ticket.id,
    contactId: contact.id
  });
};
