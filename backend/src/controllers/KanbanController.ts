import { Request, Response } from "express";
import { Op } from "sequelize";
import KanbanStage from "../models/KanbanStage";
import Ticket from "../models/Ticket";
import AppError from "../errors/AppError";

export const listStages = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  let stages = await KanbanStage.findAll({
    where: { tenantId },
    order: [["position", "ASC"]],
    include: [
      {
        model: Ticket,
        as: "tickets",
        where: { status: { [Op.or]: ["open", "pending"] } },
        required: false,
        include: ["contact", "user", "queue"]
      }
    ]
  });

  // Se o inquilino não tiver colunas, criamos as padrões automaticamente!
  if (stages.length === 0) {
    const defaults = [
      { name: "Lead", color: "#2196F3", position: 1, tenantId },
      { name: "Em Negociação", color: "#FF9800", position: 2, tenantId },
      { name: "Finalizado", color: "#4CAF50", position: 3, tenantId }
    ];

    await KanbanStage.bulkCreate(defaults);

    stages = await KanbanStage.findAll({
      where: { tenantId },
      order: [["position", "ASC"]],
      include: [
        {
          model: Ticket,
          as: "tickets",
          where: { status: { [Op.or]: ["open", "pending"] } },
          required: false,
          include: ["contact", "user", "queue"]
        }
      ]
    });
  }

  return res.status(200).json(stages);
};

export const createStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { name, color, position } = req.body;

  if (!name) {
    throw new AppError("ERR_NAME_REQUIRED", 400);
  }

  const stage = await KanbanStage.create({
    name,
    color: color || "#2196F3",
    position: position || 0,
    tenantId
  });

  return res.status(201).json(stage);
};

export const updateStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { stageId } = req.params;
  const { name, color, position } = req.body;

  const stage = await KanbanStage.findOne({
    where: { id: stageId, tenantId }
  });

  if (!stage) {
    throw new AppError("ERR_STAGE_NOT_FOUND", 404);
  }

  await stage.update({
    name: name !== undefined ? name : stage.name,
    color: color !== undefined ? color : stage.color,
    position: position !== undefined ? position : stage.position
  });

  return res.status(200).json(stage);
};

export const deleteStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { stageId } = req.params;

  const stage = await KanbanStage.findOne({
    where: { id: stageId, tenantId }
  });

  if (!stage) {
    throw new AppError("ERR_STAGE_NOT_FOUND", 404);
  }

  await stage.destroy();

  return res.status(200).json({ success: true, message: "Stage deleted successfully" });
};

export const updateTicketStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketId } = req.params;
  const { stageId } = req.body;

  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId }
  });

  if (!ticket) {
    throw new AppError("ERR_TICKET_NOT_FOUND", 404);
  }

  // Se stageId for nulo/vazio, removemos o ticket do Kanban
  await ticket.update({
    kanbanStageId: stageId ? parseInt(stageId) : null
  });

  return res.status(200).json(ticket);
};
