import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as WebhookController from "../controllers/WebhookController";

const webhookRoutes = Router();

webhookRoutes.get("/webhooks", isAuth, WebhookController.listWebhooks);
webhookRoutes.post("/webhooks", isAuth, WebhookController.createWebhook);
webhookRoutes.put("/webhooks/:webhookId", isAuth, WebhookController.updateWebhook);
webhookRoutes.delete("/webhooks/:webhookId", isAuth, WebhookController.deleteWebhook);

export default webhookRoutes;
