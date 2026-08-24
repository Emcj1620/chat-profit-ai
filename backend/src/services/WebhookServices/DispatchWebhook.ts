import http from "http";
import https from "https";
import { URL } from "url";
import Webhook from "../../models/Webhook";

export const DispatchWebhook = async (
  tenantId: number,
  trigger: string,
  payload: any
): Promise<void> => {
  // Find all active webhooks for this tenant and trigger
  const webhooks = await Webhook.findAll({
    where: {
      tenantId,
      trigger,
      active: true
    }
  });

  if (webhooks.length === 0) return;

  const data = JSON.stringify({
    event: trigger,
    timestamp: new Date().toISOString(),
    tenantId,
    data: payload
  });

  for (const hook of webhooks) {
    try {
      const parsedUrl = new URL(hook.url);
      const requestModule = parsedUrl.protocol === "https:" ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent": "ChatProfitAI-Webhook-Dispatcher/1.0"
        }
      };

      const req = requestModule.request(options);
      req.on("error", (err) => {
        console.error(`Webhook Dispatch Error [ID: ${hook.id}, URL: ${hook.url}]:`, err.message);
      });
      req.write(data);
      req.end();
    } catch (err: any) {
      console.error(`Invalid Webhook URL [ID: ${hook.id}, URL: ${hook.url}]:`, err.message);
    }
  }
};
