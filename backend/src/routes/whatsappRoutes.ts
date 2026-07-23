import express from "express";
import isAuth from "../middleware/isAuth";
import checkSubscription from "../middleware/checkSubscription";

import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post(
  "/whatsapp/",
  isAuth,
  checkSubscription,
  WhatsAppController.store
);

whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);

whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  WhatsAppController.remove
);

export default whatsappRoutes;
