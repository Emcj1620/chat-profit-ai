import { Request, Response } from "express";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import Setting from "../models/Setting";

export const index = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const settings = await ListSettingsService(req.user.tenantId);

  return res.status(200).json(settings);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { settingKey: key } = req.params;
  const { value } = req.body;

  const setting = await UpdateSettingService({
    key,
    value,
    tenantId: req.user.tenantId
  });

  const io = getIO();
  io.emit("settings", {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};

export const publicIndex = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : 1;

  const settings = await ListSettingsService(tenantId);

  if (!settings) {
    return res.status(200).json([]);
  }

  const publicKeys = [
    "primaryColor",
    "secondaryColor",
    "userCreation",
    "appName",
    "appLogoLight",
    "appLogoDark",
    "appFavicon",
    "appBackground",
    "darkModeBgColor",
    "headerBgColor",
    "sidebarTextColor",
    "sidebarBgColor"
  ];
  const publicSettings = settings.filter(s => publicKeys.includes(s.key));

  const appNameSetting = publicSettings.find(s => s.key === "appName");
  if (!appNameSetting || appNameSetting.value === "WhaTicket" || appNameSetting.value.includes("'s System")) {
    if (appNameSetting) {
      appNameSetting.value = "Chat Profit AI";
      Setting.update({ value: "Chat Profit AI" }, { where: { id: appNameSetting.id } }).catch(() => {});
    } else {
      const created = await Setting.create({ key: "appName", value: "Chat Profit AI", tenantId });
      publicSettings.push(created);
    }
  }

  return res.status(200).json(publicSettings);
};

export const uploadLogo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const file = req.file;
  const { mode } = req.body; // 'light', 'dark', 'favicon' or 'background'

  if (!file) {
    throw new AppError("ERR_NO_FILE_UPLOADED", 400);
  }

  let settingKey = "appLogoLight";
  if (mode === "favicon") settingKey = "appFavicon";
  else if (mode === "dark") settingKey = "appLogoDark";
  else if (mode === "background") settingKey = "appBackground";
  else if (mode === "light") settingKey = "appLogoLight";
  const tenantId = req.user.tenantId;

  let setting = await Setting.findOne({
    where: { key: settingKey, tenantId }
  });

  if (setting) {
    await setting.update({ value: file.filename });
  } else {
    setting = await Setting.create({
      key: settingKey,
      value: file.filename,
      tenantId
    });
  }

  const io = getIO();
  io.emit("settings", {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};
