import { Op } from "sequelize";
import User from "../../models/User";
import AppError from "../../errors/AppError";

interface Request {
  token: string;
  password: string;
}

const ResetPasswordService = async ({ token, password }: Request): Promise<void> => {
  if (!token) {
    throw new AppError("Token de redefinição não fornecido.", 400);
  }

  if (!password || password.length < 6) {
    throw new AppError("A senha deve conter no mínimo 6 caracteres.", 400);
  }

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        [Op.gt]: new Date()
      }
    }
  });

  if (!user) {
    throw new AppError("Token inválido ou expirado. Solicite a redefinição novamente.", 400);
  }

  user.password = password;
  user.resetPasswordToken = null as any;
  user.resetPasswordExpires = null as any;

  await user.save();
};

export default ResetPasswordService;
