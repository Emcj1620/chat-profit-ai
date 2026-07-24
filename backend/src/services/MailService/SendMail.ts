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
    // 1ª tentativa: domínio customizado zapprofit.com.br
    let result = await sendHttpRequest(customFrom);
    console.log(`[SendMail] 1ª tentativa (${customFrom}) - Status: ${result.statusCode} - Response: ${result.data}`);

    // Se falhar por qualquer motivo 4xx, tenta com o sender de onboarding do Resend
    if (result.statusCode >= 400) {
      console.warn(`[SendMail] Tentativa 1 falhou (${result.statusCode}). Tentando fallback onboarding@resend.dev...`);
      result = await sendHttpRequest(fallbackFrom);
      console.log(`[SendMail] 2ª tentativa (fallback) - Status: ${result.statusCode} - Response: ${result.data}`);
    }

    if (result.statusCode >= 400) {
      console.error("[SendMail] Ambas as tentativas falharam:", result.data);
      // Mensagem de erro mais útil baseada no código
      if (result.statusCode === 401 || result.statusCode === 403) {
        throw new AppError("Erro de autenticação com o serviço de e-mail. Contate o administrador.", 500);
      }
      throw new AppError("Não foi possível enviar o e-mail de recuperação. Tente novamente em alguns minutos.", 500);
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[SendMail] Exceção inesperada:", err);
    throw new AppError("Erro interno ao enviar e-mail de recuperação.", 500);
  }
};
