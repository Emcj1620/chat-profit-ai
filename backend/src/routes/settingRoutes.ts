import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as SettingController from "../controllers/SettingController";
import multer from "multer";
import uploadConfig from "../config/upload";

const settingRoutes = Router();
const upload = multer(uploadConfig);

settingRoutes.post("/settings/logo", isAuth, upload.single("file"), SettingController.uploadLogo);

settingRoutes.get("/settings/public", SettingController.publicIndex);
settingRoutes.get("/settings", isAuth, SettingController.index);

// routes.get("/settings/:settingKey", isAuth, SettingsController.show);

// change setting key to key in future
settingRoutes.put("/settings/:settingKey", isAuth, SettingController.update);

export default settingRoutes;
