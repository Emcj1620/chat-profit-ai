import crypto from "crypto";
import User from "../../models/User";
import AppError from "../../errors/AppError";
import { sendMail } from "../MailService/SendMail";

const SendResetPasswordEmailService = async (email: string): Promise<void> => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    throw new AppError("E-mail não encontrado no sistema.", 404);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hora de validade

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();

  const resetUrl = `https://chat.zapprofit.com.br/reset-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px; color: #333;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">Chat Profit AI</h2>
        <p>Olá, <strong>${user.name}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para cadastrar sua nova senha. O link é válido por <strong>1 hora</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 13px; color: #777;">Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">Chat Profit AI &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: "Redefinição de Senha - Chat Profit AI",
    html: htmlContent
  });
};

export default SendResetPasswordEmailService;
