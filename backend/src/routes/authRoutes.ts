import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as UserController from "../controllers/UserController";
import isAuth from "../middleware/isAuth";
import {
  loginRateLimiter,
  signupRateLimiter,
  forgotPasswordRateLimiter
} from "../middleware/rateLimiter";

const authRoutes = Router();

authRoutes.post("/signup", signupRateLimiter, UserController.store);

authRoutes.post("/login", loginRateLimiter, SessionController.store);

authRoutes.post("/forgot-password", forgotPasswordRateLimiter, SessionController.forgotPassword);

authRoutes.post("/reset-password", forgotPasswordRateLimiter, SessionController.resetPassword);

authRoutes.delete("/logout", isAuth, SessionController.remove);

export default authRoutes;
