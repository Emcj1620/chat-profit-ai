import ChatFlow from "../../models/ChatFlow";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import axios from "axios";
import CreateMessageService from "../MessageServices/CreateMessageService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { whatsappProvider } from "../../providers/WhatsApp/whatsappProvider";
import { logger } from "../../utils/logger";
import formatBody from "../../helpers/Mustache";
import { getIO } from "../../libs/socket";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface FlowNode {
  id: string;
  type: string;
  data: {
    text?: string;
    mediaUrl?: string;
    mediaType?: string;
    variable?: string;
    simulateTyping?: boolean;
    simulateRecording?: boolean;
    tagToAdd?: string;
    kanbanStageId?: number;
    queueId?: number;
    userId?: number;
    conditionVar?: string;
    conditionOperator?: "equals" | "contains" | "starts_with" | "is_empty";
    conditionValue?: string;
    actionType?: "tag" | "kanban" | "transfer" | "close";
    value?: number;
    unit?: "seconds" | "minutes" | "hours" | "days";
    url?: string;
    method?: "GET" | "POST";
    headers?: string;
    body?: string;
    mappings?: Array<{ responsePath: string; variable: string }>;
  };
}

interface FlowConnection {
  source: string;
  target: string;
  sourceHandle?: string;
}

interface FlowData {
  nodes: FlowNode[];
  connections: FlowConnection[];
}

// Helper to replace variables like {nome}, {email} in text templates
const formatVariables = (text: string, contact: Contact, flowState: any): string => {
  if (!text) return "";
  let formatted = text
    .replace(/{nome}/gi, contact.name || "")
    .replace(/{numero}/gi, contact.number || "");

  // Replace any other custom variables stored in flowState
  const keys = Object.keys(flowState);
  for (const key of keys) {
    const val = flowState[key] || "";
    formatted = formatted.replace(new RegExp(`{${key}}`, "gi"), val);
  }

  return formatted;
};

// Find next node based on current node ID and choice handle
const getNextNodeId = (
  flowData: FlowData,
  currentNodeId: string,
  handle?: string
): string | null => {
  const connections = flowData.connections || [];
  const matched = connections.find(c => {
    if (handle) {
      return c.source === currentNodeId && c.sourceHandle === handle;
    }
    return c.source === currentNodeId;
  });

  return matched ? matched.target : null;
};

// Core Flow Runner function
export const RunFlow = async (
  ticket: Ticket,
  incomingMessage?: string
): Promise<void> => {
  if (!ticket.flowId) return;

  try {
    const chatFlow = await ChatFlow.findByPk(ticket.flowId);
    if (!chatFlow || !chatFlow.isActive) return;

    const flowData: FlowData = JSON.parse(chatFlow.flowData || "{}");
    const nodes = flowData.nodes || [];

    let currentNodeId: string | null = ticket.flowNodeId;
    let flowState = JSON.parse(ticket.flowState || "{}");
    const contact = await Contact.findByPk(ticket.contactId);

    if (!contact) {
      logger.error("FlowRunner: Recipient contact not found for ticket ID " + ticket.id);
      return;
    }

    const chatId = `${contact.number}@c.us`;

    // 1. If currently on an INPUT node and user replied, save the response and advance
    if (currentNodeId) {
      const currentNode = nodes.find(n => n.id === currentNodeId);
      if (currentNode && currentNode.type === "input" && incomingMessage) {
        const variableName = currentNode.data.variable || "last_input";
        flowState[variableName] = incomingMessage.trim();
        await ticket.update({ flowState: JSON.stringify(flowState) });

        // Move to the next node
        currentNodeId = getNextNodeId(flowData, currentNodeId);
      }
    }

    // 2. If no current node ID is set (meaning the flow is just starting), find the START node
    if (!currentNodeId) {
      const startNode = nodes.find(n => n.type === "start");
      if (!startNode) {
        logger.error("FlowRunner: Start node not found for flow ID " + chatFlow.id);
        return;
      }
      currentNodeId = getNextNodeId(flowData, startNode.id);
    }

    // 3. Execution loop for sequential nodes
    while (currentNodeId) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      logger.debug(`FlowRunner: Processing node ID ${node.id} of type ${node.type}`);

      // Update current ticket node reference
      await ticket.update({ flowNodeId: node.id });

      if (node.type === "message") {
        const rawText = node.data.text || "";
        const formattedText = formatVariables(rawText, contact, flowState);

        // Presence simulation
        if (node.data.simulateTyping) {
          await whatsappProvider.sendPresenceState(ticket.whatsappId, chatId, "typing");
          const typingDuration = Math.min(Math.max(formattedText.length * 40, 1000), 3000);
          await sleep(typingDuration);
          await whatsappProvider.sendPresenceState(ticket.whatsappId, chatId, "clear");
        }

        let sentMessageId = `flow_${Date.now()}`;

        if (node.data.mediaUrl) {
          // If simulate recording for audio
          if (node.data.simulateRecording && node.data.mediaType === "audio") {
            await whatsappProvider.sendPresenceState(ticket.whatsappId, chatId, "recording");
            await sleep(4000);
            await whatsappProvider.sendPresenceState(ticket.whatsappId, chatId, "clear");
          }

          // Fetch media attachment payload/details if needed and send
          // For simplicity, we can send it using standard public directory paths or URL downloads
          try {
            // Check if media is locally hosted or absolute URL
            const providerMsg = await whatsappProvider.sendMedia(
              ticket.whatsappId,
              chatId,
              {
                mimetype: node.data.mediaType || "application/octet-stream",
                filename: node.data.mediaUrl.split("/").pop() || "file",
                data: Buffer.from(node.data.mediaUrl, "utf-8") // In a real system, download URL or pass absolute path
              },
              { caption: formattedText }
            );
            sentMessageId = providerMsg.id;
          } catch (mediaErr: any) {
            logger.error(`FlowRunner: Failed to send media: ${mediaErr.message}`);
            // Fallback: send text only
            const providerMsg = await whatsappProvider.sendMessage(ticket.whatsappId, chatId, formattedText);
            sentMessageId = providerMsg.id;
          }
        } else {
          // Send plain text message
          const providerMsg = await whatsappProvider.sendMessage(ticket.whatsappId, chatId, formattedText);
          sentMessageId = providerMsg.id;
        }

        // Save sent message to ticket history
        const messageData = {
          id: sentMessageId,
          ticketId: ticket.id,
          contactId: undefined, // sent by system bot
          body: formattedText || node.data.mediaUrl || "Attachment",
          fromMe: true,
          read: true,
          mediaType: node.data.mediaUrl ? (node.data.mediaType?.split("/")[0] || "document") : "chat",
          mediaUrl: node.data.mediaUrl || undefined,
          ack: 1
        };

        await CreateMessageService({ messageData });
        await ticket.update({ lastMessage: messageData.body });

        // Advance to next node
        currentNodeId = getNextNodeId(flowData, node.id);

      } else if (node.type === "input") {
        // Stop execution and wait for user reply.
        // The current nodeId is saved, and we will resume on the next incoming message.
        return;

      } else if (node.type === "condition") {
        const varName = node.data.conditionVar || "";
        const operator = node.data.conditionOperator || "equals";
        const expectedValue = (node.data.conditionValue || "").trim().toLowerCase();

        const actualValue = String(flowState[varName] || "").trim().toLowerCase();
        let isTrue = false;

        if (operator === "equals") {
          isTrue = actualValue === expectedValue;
        } else if (operator === "contains") {
          isTrue = actualValue.includes(expectedValue);
        } else if (operator === "starts_with") {
          isTrue = actualValue.startsWith(expectedValue);
        } else if (operator === "is_empty") {
          isTrue = !actualValue;
        }

        // Branch target based on true/false handles
        const handle = isTrue ? "yes" : "no";
        currentNodeId = getNextNodeId(flowData, node.id, handle);

      } else if (node.type === "action") {
        const actionType = node.data.actionType;

        if (actionType === "tag" && node.data.tagToAdd) {
          const tag = node.data.tagToAdd;
          const currentTags = contact.tags ? contact.tags.split(",").map(t => t.trim()) : [];
          if (!currentTags.includes(tag)) {
            const merged = [...currentTags, tag].filter(Boolean);
            await contact.update({ tags: merged.join(",") });
          }
        }

        if (actionType === "kanban" && node.data.kanbanStageId) {
          await ticket.update({ kanbanStageId: node.data.kanbanStageId });
        }

        if (actionType === "close") {
          // Close ticket and exit flow
          await ticket.update({
            status: "closed",
            flowId: null,
            flowNodeId: null,
            flowState: null
          });
          return;
        }

        if (actionType === "transfer") {
          // Transfer to queue or user
          await UpdateTicketService({
            ticketData: {
              queueId: node.data.queueId || ticket.queueId,
              userId: node.data.userId || undefined
            },
            ticketId: ticket.id
          });

          // Terminate flow and remove flow variables so human takes over
          await ticket.update({
            flowId: null,
            flowNodeId: null,
            flowState: null
          });

          // Notify frontend via websocket of ticket transfer
          const io = getIO();
          io.to(ticket.id.toString()).emit("ticket", {
            action: "update",
            ticket
          });
          return;
        }

        // Advance to next node after action
        currentNodeId = getNextNodeId(flowData, node.id);
      } else if (node.type === "timer") {
        const delayValue = Number(node.data.value) || 10;
        const delayUnit = node.data.unit || "seconds";
        let multiplier = 1000;
        if (delayUnit === "minutes") multiplier = 60 * 1000;
        if (delayUnit === "hours") multiplier = 60 * 60 * 1000;
        if (delayUnit === "days") multiplier = 24 * 60 * 60 * 1000;

        const delayMs = delayValue * multiplier;
        const timerDelayUntil = new Date(Date.now() + delayMs);
        const nextNodeId = getNextNodeId(flowData, node.id);

        await ticket.update({
          timerDelayUntil,
          flowNodeId: nextNodeId
        });

        logger.info(`FlowRunner: Pausing flow for ticket ID ${ticket.id} until ${timerDelayUntil}`);
        return; // stop execution loop, background runner will resume

      } else if (node.type === "api_request") {
        let requestUrl = formatVariables(node.data.url || "", contact, flowState);
        let requestBodyRaw = formatVariables(node.data.body || "", contact, flowState);
        let requestHeadersRaw = formatVariables(node.data.headers || "", contact, flowState);

        let headersObj = {};
        try {
          if (requestHeadersRaw) {
            headersObj = JSON.parse(requestHeadersRaw);
          }
        } catch (e: any) {
          logger.error("FlowRunner: Error parsing headers JSON: " + e.message);
        }

        let bodyObj = null;
        try {
          if (requestBodyRaw) {
            bodyObj = JSON.parse(requestBodyRaw);
          }
        } catch (e) {
          bodyObj = requestBodyRaw;
        }

        let success = false;
        let responseData = null;

        try {
          const response = await axios({
            method: node.data.method || "GET",
            url: requestUrl,
            headers: headersObj,
            data: bodyObj,
            timeout: 10000
          });
          responseData = response.data;
          success = true;
        } catch (err: any) {
          logger.error(`FlowRunner API Node Request Failed: ${err.message}`);
          responseData = err.response?.data || null;
        }

        if (success && responseData && Array.isArray(node.data.mappings)) {
          const getValueByPath = (obj: any, path: string): any => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
          };

          for (const item of node.data.mappings) {
            if (item.responsePath && item.variable) {
              const val = getValueByPath(responseData, item.responsePath);
              if (val !== undefined) {
                flowState[item.variable] = String(val);
              }
            }
          }
          await ticket.update({ flowState: JSON.stringify(flowState) });
        }

        // Branch transition based on success/failure handles
        const handle = success ? "success" : "failure";
        currentNodeId = getNextNodeId(flowData, node.id, handle);

      } else {
        // Skip unknown node types
        currentNodeId = getNextNodeId(flowData, node.id);
      }
    }

    // Loop finished and no more nodes, mark flow as ended on the ticket
    await ticket.update({
      flowId: null,
      flowNodeId: null,
      flowState: null
    });

  } catch (err: any) {
    logger.error(`FlowRunner Error: ${err.message}`);
  }
};
