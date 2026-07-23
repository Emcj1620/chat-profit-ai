import express from "express";
import isAuth from "../middleware/isAuth";
import * as CampaignController from "../controllers/CampaignController";

const campaignRoutes = express.Router();

campaignRoutes.get("/campaigns", isAuth, CampaignController.list);
campaignRoutes.get("/campaigns/:id", isAuth, CampaignController.show);
campaignRoutes.post("/campaigns", isAuth, CampaignController.create);
campaignRoutes.put("/campaigns/:id", isAuth, CampaignController.update);
campaignRoutes.delete("/campaigns/:id", isAuth, CampaignController.remove);
campaignRoutes.post("/campaigns/:id/start", isAuth, CampaignController.start);
campaignRoutes.post("/campaigns/:id/pause", isAuth, CampaignController.pause);

export default campaignRoutes;
