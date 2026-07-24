import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  res.cookie("jrt", token, {
    httpOnly: true,
    sameSite: "none",   // Necessário para cross-origin (Cloudflare Pages -> API)
    secure: true,       // Necessário quando sameSite=none
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
  });
};
