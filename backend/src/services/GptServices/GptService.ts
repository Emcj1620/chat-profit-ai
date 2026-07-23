import https from "https";
import AppError from "../../errors/AppError";

interface GptMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Request {
  apiKey: string;
  model: string;
  prompt: string;
  guidelines?: string;
  temperature?: number;
  messages: GptMessage[];
}

export const GptService = async ({
  apiKey,
  model = "gpt-4o-mini",
  prompt,
  guidelines = "",
  temperature = 0.7,
  messages
}: Request): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Preparar as mensagens do sistema
    const systemInstruction = `${prompt || "Você é um assistente virtual atencioso."}\n\nDiretrizes Operacionais:\n${guidelines}`;
    
    const requestMessages: GptMessage[] = [
      { role: "system", content: systemInstruction },
      ...messages
    ];

    const data = JSON.stringify({
      model,
      messages: requestMessages,
      temperature
    });

    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new AppError(parsed.error?.message || `OpenAI API Error: ${body}`));
          } else {
            const reply = parsed.choices?.[0]?.message?.content;
            if (reply) {
              resolve(reply.trim());
            } else {
              reject(new AppError(`No reply content returned from OpenAI: ${body}`));
            }
          }
        } catch (e) {
          reject(new AppError(`Failed to parse OpenAI API response: ${body}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
};
