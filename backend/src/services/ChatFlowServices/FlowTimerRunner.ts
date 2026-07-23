import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import { RunFlow } from "./FlowRunner";
import { logger } from "../../utils/logger";

let timerInterval: NodeJS.Timeout | null = null;

const checkDelayedTickets = async (): Promise<void> => {
  try {
    const tickets = await Ticket.findAll({
      where: {
        timerDelayUntil: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.lte]: new Date() }
          ]
        }
      }
    });

    if (tickets.length === 0) return;

    for (const ticket of tickets) {
      try {
        logger.info(`FlowTimerRunner: Resuming chatbot flow for ticket ID ${ticket.id}`);
        
        // Clear the delay marker before resuming to avoid infinite resume loops in case of runner errors
        await ticket.update({ timerDelayUntil: null });
        
        // Resume flow execution
        await RunFlow(ticket);
      } catch (err: any) {
        logger.error(`FlowTimerRunner: Error resuming flow on ticket ${ticket.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    logger.error(`FlowTimerRunner Error: ${err.message}`);
  }
};

export const StartFlowTimerRunner = (): void => {
  if (timerInterval) return;
  
  logger.info("Starting Background Chatbot Flow Timer Runner...");
  
  timerInterval = setInterval(async () => {
    await checkDelayedTickets();
  }, 5000); // Check delayed flows every 5 seconds
};
