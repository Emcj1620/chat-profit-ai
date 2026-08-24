import http from "http";
import https from "https";
import { URL } from "url";
import Ticket from "../../models/Ticket";

const makePostRequest = (urlStr: string, body: any): Promise<any> => {
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
            // If it's a raw string response, resolve as raw string
            resolve(data);
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

export const RunN8n = async (
  ticket: Ticket,
  messageBody: string,
  n8nUrl: string
): Promise<string> => {
  const payload = {
    message: messageBody,
    contact: {
      id: ticket.contact?.id,
      name: ticket.contact?.name,
      number: ticket.contact?.number
    },
    ticketId: ticket.id,
    tenantId: ticket.tenantId
  };

  const response = await makePostRequest(n8nUrl, payload);

  if (typeof response === "string") {
    return response;
  }

  if (response) {
    if (response.reply) return response.reply;
    if (response.message) return response.message;
    if (response.response) return response.response;
    if (response.output) return response.output;
    // Fallback if n8n returns an object/array without explicit keys
    return JSON.stringify(response);
  }

  return "";
};
