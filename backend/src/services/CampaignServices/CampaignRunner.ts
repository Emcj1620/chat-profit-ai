import { Op } from "sequelize";
import Campaign from "../../models/Campaign";
import CampaignContact from "../../models/CampaignContact";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { whatsappProvider } from "../../providers/WhatsApp";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

const checkCampaigns = async (): Promise<void> => {
  const runningCampaigns = await Campaign.findAll({
    where: { status: "running" }
  });

  if (runningCampaigns.length === 0) return;

  for (const campaign of runningCampaigns) {
    try {
      const lastSentContact = await CampaignContact.findOne({
        where: {
          campaignId: campaign.id,
          status: { [Op.or]: ["sent", "failed"] }
        },
        order: [["sentAt", "DESC"]]
      });

      let lastSentTime = campaign.updatedAt.getTime();
      if (lastSentContact && lastSentContact.sentAt) {
        lastSentTime = lastSentContact.sentAt.getTime();
      }

      // Calculate random delay in seconds between minDelay and maxDelay
      const min = campaign.minDelay || 10;
      const max = campaign.maxDelay || 20;
      const randomDelaySeconds = Math.floor(Math.random() * (max - min + 1)) + min;
      const nextAllowedTime = lastSentTime + randomDelaySeconds * 1000;

      if (Date.now() < nextAllowedTime) {
        // It is not time to dispatch yet, skip this campaign for this tick
        continue;
      }

      // 2. Find the next pending contact
      const nextContact = await CampaignContact.findOne({
        where: { campaignId: campaign.id, status: "pending" },
        order: [["id", "ASC"]]
      });

      if (!nextContact) {
        // All contacts processed, mark campaign as completed
        await campaign.update({ status: "completed" });
        const io = getIO();
        io.emit("campaign", { action: "update", campaign });
        continue;
      }

      // 3. Load allowed WhatsApp connections for this campaign
      const campaignWithWhatsapps = await Campaign.findByPk(campaign.id, {
        include: [
          {
            model: Whatsapp,
            as: "whatsapps",
            where: { status: "CONNECTED" },
            required: false
          }
        ]
      });

      const whatsapps = campaignWithWhatsapps?.whatsapps || [];

      if (whatsapps.length === 0) {
        logger.warn(`Campaign ${campaign.name} is running but no connected WhatsApps found. Skipping tick.`);
        continue;
      }

      // Pick a random WhatsApp connection from the connected ones
      const whatsapp = whatsapps[Math.floor(Math.random() * whatsapps.length)];

      // 4. Select a random non-empty message template
      const templates = [
        campaign.message1,
        campaign.message2,
        campaign.message3,
        campaign.message4,
        campaign.message5
      ].filter(t => t && t.trim() !== "");

      if (templates.length === 0) {
        logger.error(`Campaign ${campaign.name} has no message templates configured. Pausing campaign.`);
        await campaign.update({ status: "suspended" });
        continue;
      }

      const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

      // Format template variables
      const formattedMessage = selectedTemplate
        .replace(/{nome}/gi, nextContact.name || "")
        .replace(/{numero}/gi, nextContact.number || "");

      // 5. Send message
      const chatId = `${nextContact.number}@c.us`;

      try {
        await whatsappProvider.sendMessage(whatsapp.id, chatId, formattedMessage);

        // Update contact status to sent
        await nextContact.update({
          status: "sent",
          sentAt: new Date()
        });

        // 6. Apply Tags if specified
        let contact = await Contact.findOne({
          where: { number: nextContact.number, tenantId: campaign.tenantId }
        });

        if (!contact) {
          contact = await CreateOrUpdateContactService({
            name: nextContact.name || nextContact.number,
            number: nextContact.number,
            isGroup: false,
            tenantId: campaign.tenantId
          });
          await nextContact.update({ contactId: contact.id });
        } else if (!nextContact.contactId) {
          await nextContact.update({ contactId: contact.id });
        }

        if (campaign.tagsToAdd && campaign.tagsToAdd.trim() !== "") {
          const currentTags = contact.tags ? contact.tags.split(",").map(t => t.trim()) : [];
          const newTags = campaign.tagsToAdd.split(",").map(t => t.trim());
          const mergedTags = Array.from(new Set([...currentTags, ...newTags])).filter(Boolean);
          await contact.update({ tags: mergedTags.join(",") });
        }

        // 7. Route to Kanban stage if specified
        if (campaign.kanbanStageId) {
          const ticket = await FindOrCreateTicketService(contact, whatsapp.id, 0, campaign.tenantId);
          await ticket.update({ kanbanStageId: campaign.kanbanStageId });
        }

      } catch (err: any) {
        logger.error(`Failed to send campaign message to ${nextContact.number}: ${err.message}`);
        await nextContact.update({
          status: "failed",
          sentAt: new Date(),
          errorMessage: err.message || "Unknown sending error"
        });
      }

      // Emit socket update event to refresh UI dashboard
      const io = getIO();
      io.emit("campaign", { action: "update", campaign });

    } catch (campaignErr: any) {
      logger.error(`Error processing campaign ${campaign.name} iteration: ${campaignErr.message}`);
    }
  }
};

let runnerInterval: NodeJS.Timeout | null = null;

export const StartCampaignRunner = (): void => {
  if (runnerInterval) return;
  logger.info("Starting Background Campaign Broadcast Runner...");
  runnerInterval = setInterval(async () => {
    await checkCampaigns();
  }, 10000); // Check campaigns every 10 seconds
};

export const StopCampaignRunner = (): void => {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
    logger.info("Stopped Background Campaign Broadcast Runner.");
  }
};
