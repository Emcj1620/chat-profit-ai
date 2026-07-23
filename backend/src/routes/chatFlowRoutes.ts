import express from "express";
import isAuth from "../middleware/isAuth";
import * as ChatFlowController from "../controllers/ChatFlowController";

const chatFlowRoutes = express.Router();

chatFlowRoutes.get("/chatflows", isAuth, ChatFlowController.list);
chatFlowRoutes.get("/chatflows/:id", isAuth, ChatFlowController.show);
chatFlowRoutes.post("/chatflows", isAuth, ChatFlowController.create);
chatFlowRoutes.put("/chatflows/:id", isAuth, ChatFlowController.update);
chatFlowRoutes.delete("/chatflows/:id", isAuth, ChatFlowController.remove);

export default chatFlowRoutes;
