import https from "https";

interface SendMailData {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailData): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY || "re_TJtzrQTH_MeHo83GDVdTv3xjaDR44EokV";
  const mailFrom = process.env.MAIL_FROM || "Chat Profit AI <nao-responda@zapprofit.com.br>";

  const payload = JSON.stringify({
    from: mailFrom,
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
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            console.error("Resend Email Error:", responseData);
            reject(new Error(`Erro ao enviar e-mail: ${responseData}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};
