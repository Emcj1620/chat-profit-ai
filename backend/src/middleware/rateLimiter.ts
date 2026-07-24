import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RequestRecord>();

// Limpeza periódica de memória a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (options: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
    const ip = rawIp.split(",")[0].trim();
    const key = `${req.baseUrl}${req.path}_${ip}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      throw new AppError(
        options.message || `Muitas tentativas. Por favor, aguarde ${retryAfterSeconds} segundos antes de tentar novamente.`,
        429
      );
    }

    record.count += 1;
    return next();
  };
};

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Máximo 3 solicitações por IP
  message: "Muitas solicitações de redefinição de senha. Por favor, aguarde 15 minutos para tentar novamente."
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 tentativas por minuto
  message: "Muitas tentativas de login incorretas. Por favor, aguarde 1 minuto."
});

export const signupRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 cadastros por hora
  message: "Muitas contas criadas recentemente a partir deste IP. Aguarde 1 hora."
});

export const refreshRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // Máximo 60 refreshes por minuto (1 por segundo) — normal para uso real
  message: "Muitas solicitações de refresh de token. Por favor, aguarde."
});

export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 200, // Máximo 200 requisições por minuto
  message: "Limite de requisições à API excedido."
});
