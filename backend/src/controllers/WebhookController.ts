import { Request, Response } from "express";
import Webhook from "../models/Webhook";
import AppError from "../errors/AppError";

export const listWebhooks = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const webhooks = await Webhook.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]]
  });

  return res.status(200).json(webhooks);
};

export const createWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { name, url, trigger, active } = req.body;

  if (!name || !url) {
    throw new AppError("ERR_NAME_AND_URL_REQUIRED", 400);
  }

  const webhook = await Webhook.create({
    name,
    url,
    trigger: trigger || "message_received",
    active: active !== undefined ? active : true,
    tenantId
  });

  return res.status(201).json(webhook);
};

export const updateWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { webhookId } = req.params;
  const { name, url, trigger, active } = req.body;

  const webhook = await Webhook.findOne({
    where: { id: webhookId, tenantId }
  });

  if (!webhook) {
    throw new AppError("ERR_WEBHOOK_NOT_FOUND", 404);
  }

  await webhook.update({
    name: name !== undefined ? name : webhook.name,
    url: url !== undefined ? url : webhook.url,
    trigger: trigger !== undefined ? trigger : webhook.trigger,
    active: active !== undefined ? active : webhook.active
  });

  return res.status(200).json(webhook);
};

export const deleteWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { webhookId } = req.params;

  const webhook = await Webhook.findOne({
    where: { id: webhookId, tenantId }
  });

  if (!webhook) {
    throw new AppError("ERR_WEBHOOK_NOT_FOUND", 404);
  }

  await webhook.destroy();

  return res.status(200).json({ success: true, message: "Webhook deleted successfully" });
};
