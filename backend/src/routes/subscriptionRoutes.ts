import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = Router();

subscriptionRoutes.get("/subscription", isAuth, SubscriptionController.index);
subscriptionRoutes.post("/subscription/pay", isAuth, SubscriptionController.createPayment);
subscriptionRoutes.post("/subscription/simulate-payment", isAuth, SubscriptionController.simulatePayment);

// Webhook endpoints are public (no authentication required)
subscriptionRoutes.post("/subscription/webhook/asaas", SubscriptionController.webhookAsaas);
subscriptionRoutes.post("/subscription/webhook/stripe", SubscriptionController.webhookStripe);

export default subscriptionRoutes;
