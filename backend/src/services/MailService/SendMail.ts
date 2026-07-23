import https from "https";
import AppError from "../../errors/AppError";

interface SendMailData {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailData): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY || "re_TJtzrQTH_MeHo83GDVdTv3xjaDR44EokV";
  const customFrom = process.env.MAIL_FROM || "Chat Profit AI <nao-responda@zapprofit.com.br>";
  const fallbackFrom = "Chat Profit AI <onboarding@resend.dev>";

  const sendHttpRequest = (fromAddress: string): Promise<{ statusCode: number; data: string }> => {
    const payload = JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: html
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.resend.com",
          path: "/emails",
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        },
        res => {
          let responseData = "";
          res.on("data", chunk => (responseData += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 500, data: responseData }));
        }
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  };

  try {
    let result = await sendHttpRequest(customFrom);

    if (result.statusCode >= 400 && (result.data.includes("domain") || result.data.includes("verify") || result.data.includes("validation"))) {
      console.warn("Retrying email sending with onboarding@resend.dev fallback...");
      result = await sendHttpRequest(fallbackFrom);
    }

    if (result.statusCode >= 400) {
      console.error("Resend API Error:", result.data);
      throw new AppError("Não foi possível enviar o e-mail. Verifique se o endereço está correto.", 400);
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("SendMail Exception:", err);
    throw new AppError("Erro ao enviar e-mail de recuperação.", 500);
  }
};
