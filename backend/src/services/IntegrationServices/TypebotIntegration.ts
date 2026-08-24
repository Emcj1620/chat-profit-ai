import http from "http";
import https from "https";
import { URL } from "url";
import Ticket from "../../models/Ticket";

interface TypebotResponse {
  sessionId: string;
  messages: Array<{
    type: string;
    content: any;
  }>;
}

const extractText = (msg: any): string => {
  if (msg.content?.text) {
    return msg.content.text;
  }
  if (msg.content?.richText) {
    let result = "";
    const parseNode = (node: any) => {
      if (node.text) {
        result += node.text;
      }
      if (node.children) {
        node.children.forEach(parseNode);
      }
    };
    if (Array.isArray(msg.content.richText)) {
      msg.content.richText.forEach(parseNode);
    }
    return result;
  }
  return "";
};

const makePostRequest = (urlStr: string, body: any): Promise<TypebotResponse> => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const requestModule = parsedUrl.protocol === "https:" ? https : http;
      const postData = JSON.stringify(body);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const req = requestModule.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const RunTypebot = async (
  ticket: Ticket,
  messageBody: string,
  typebotUrl: string,
  typebotName: string
): Promise<Array<{ type: string; value: string }>> => {
  let responseData: TypebotResponse;

  // Normalize Typebot URL to ensure it has api v1 format
  // Typebot startChat endpoint: {typebotUrl}/api/v1/typebots/{typebotName}/startChat
  const baseUrl = typebotUrl.replace(/\/$/, "");
  
  if (!ticket.typebotSessionId) {
    // Start Chat
    const startUrl = `${baseUrl}/api/v1/typebots/${typebotName}/startChat`;
    responseData = await makePostRequest(startUrl, {
      message: messageBody,
      isTriggerActive: true
    });

    if (responseData?.sessionId) {
      await ticket.update({ typebotSessionId: responseData.sessionId });
    }
  } else {
    // Continue Chat
    const continueUrl = `${baseUrl}/api/v1/sessions/${ticket.typebotSessionId}/continueChat`;
    try {
      responseData = await makePostRequest(continueUrl, {
        message: messageBody
      });
    } catch (err) {
      // Session might have expired, try starting a new chat
      const startUrl = `${baseUrl}/api/v1/typebots/${typebotName}/startChat`;
      responseData = await makePostRequest(startUrl, {
        message: messageBody,
        isTriggerActive: true
      });
      if (responseData?.sessionId) {
        await ticket.update({ typebotSessionId: responseData.sessionId });
      }
    }
  }

  const results: Array<{ type: string; value: string }> = [];

  if (responseData && Array.isArray(responseData.messages)) {
    for (const msg of responseData.messages) {
      if (msg.type === "text") {
        const text = extractText(msg);
        if (text) {
          results.push({ type: "text", value: text });
        }
      } else if (
        msg.type === "image" ||
        msg.type === "video" ||
        msg.type === "audio" ||
        msg.type === "file"
      ) {
        if (msg.content?.url) {
          results.push({ type: msg.type, value: msg.content.url });
        }
      }
    }
  }

  return results;
};
