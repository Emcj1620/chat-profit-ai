import { Request, Response } from "express";
import * as Yup from "yup";
import ChatFlow from "../models/ChatFlow";
import AppError from "../errors/AppError";

interface ChatFlowData {
  name: string;
  flowData?: string;
  isActive?: boolean;
}

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const chatFlows = await ChatFlow.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]]
  });

  return res.status(200).json(chatFlows);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const chatFlow = await ChatFlow.findOne({
    where: { id, tenantId }
  });

  if (!chatFlow) {
    throw new AppError("ERR_CHATFLOW_NOT_FOUND", 404);
  }

  return res.status(200).json(chatFlow);
};

export const create = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const data: ChatFlowData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  // Create default start node structure for the flow builder if empty
  const defaultFlowData = JSON.stringify({
    nodes: [
      {
        id: "start",
        type: "start",
        position: { x: 250, y: 150 },
        data: {}
      }
    ],
    connections: []
  });

  const chatFlow = await ChatFlow.create({
    name: data.name,
    flowData: data.flowData || defaultFlowData,
    isActive: data.isActive !== undefined ? data.isActive : true,
    tenantId
  });

  return res.status(201).json(chatFlow);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const data: ChatFlowData = req.body;

  const chatFlow = await ChatFlow.findOne({
    where: { id, tenantId }
  });

  if (!chatFlow) {
    throw new AppError("ERR_CHATFLOW_NOT_FOUND", 404);
  }

  await chatFlow.update({
    name: data.name !== undefined ? data.name : chatFlow.name,
    flowData: data.flowData !== undefined ? data.flowData : chatFlow.flowData,
    isActive: data.isActive !== undefined ? data.isActive : chatFlow.isActive
  });

  return res.status(200).json(chatFlow);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const chatFlow = await ChatFlow.findOne({
    where: { id, tenantId }
  });

  if (!chatFlow) {
    throw new AppError("ERR_CHATFLOW_NOT_FOUND", 404);
  }

  await chatFlow.destroy();

  return res.status(200).json({ message: "ChatFlow deleted successfully" });
};
