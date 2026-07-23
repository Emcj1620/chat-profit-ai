import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import checkSubscription from "../middleware/checkSubscription";
import uploadConfig from "../config/upload";

import * as MessageController from "../controllers/MessageController";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.get("/messages/:ticketId", isAuth, MessageController.index);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  checkSubscription,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.delete("/messages/:messageId", isAuth, MessageController.remove);

export default messageRoutes;
