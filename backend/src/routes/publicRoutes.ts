import express from "express";
import * as PublicChatFlowController from "../controllers/PublicChatFlowController";

const publicRoutes = express.Router();

// Public route to trigger a chatbot flow by flow ID (no auth middleware)
publicRoutes.post("/public/chatflows/:id/trigger", PublicChatFlowController.trigger);

export default publicRoutes;
