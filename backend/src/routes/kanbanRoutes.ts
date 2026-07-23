import express from "express";
import isAuth from "../middleware/isAuth";
import * as KanbanController from "../controllers/KanbanController";

const kanbanRoutes = express.Router();

kanbanRoutes.get("/kanban/stages", isAuth, KanbanController.listStages);
kanbanRoutes.post("/kanban/stages", isAuth, KanbanController.createStage);
kanbanRoutes.put("/kanban/stages/:stageId", isAuth, KanbanController.updateStage);
kanbanRoutes.delete("/kanban/stages/:stageId", isAuth, KanbanController.deleteStage);
kanbanRoutes.put("/tickets/:ticketId/kanban", isAuth, KanbanController.updateTicketStage);

export default kanbanRoutes;
