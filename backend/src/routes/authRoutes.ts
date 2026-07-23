import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as UserController from "../controllers/UserController";
import isAuth from "../middleware/isAuth";

const authRoutes = Router();

authRoutes.post("/signup", UserController.store);

authRoutes.post("/login", SessionController.store);

authRoutes.post("/forgot-password", SessionController.forgotPassword);

authRoutes.post("/reset-password", SessionController.resetPassword);

authRoutes.delete("/logout", isAuth, SessionController.remove);

export default authRoutes;
