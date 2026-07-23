import { Request, Response } from "express";
import * as Yup from "yup";
import { Op } from "sequelize";
import Campaign from "../models/Campaign";
import CampaignContact from "../models/CampaignContact";
import CampaignWhatsapp from "../models/CampaignWhatsapp";
import Whatsapp from "../models/Whatsapp";
import Contact from "../models/Contact";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import AppError from "../errors/AppError";

interface CampaignData {
  name: string;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  minDelay?: number;
  maxDelay?: number;
  tagsToAdd?: string;
  kanbanStageId?: number;
  whatsappIds?: number[];
  audienceSource: "base" | "import";
  tagsFilter?: string;
  importedContacts?: string;
}

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const campaigns = await Campaign.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]],
    include: [
      { model: Whatsapp, as: "whatsapps" },
      { model: CampaignContact, as: "contacts" }
    ]
  });

  return res.status(200).json(campaigns);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const campaign = await Campaign.findOne({
    where: { id, tenantId },
    include: [
      { model: Whatsapp, as: "whatsapps" },
      { model: CampaignContact, as: "contacts" }
    ]
  });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  return res.status(200).json(campaign);
};

export const create = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const data: CampaignData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    audienceSource: Yup.string().oneOf(["base", "import"]).required(),
    minDelay: Yup.number().required().min(5),
    maxDelay: Yup.number().required().min(5)
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  // 1. Create campaign
  const campaign = await Campaign.create({
    name: data.name,
    status: "running",
    message1: data.message1 || "",
    message2: data.message2 || "",
    message3: data.message3 || "",
    message4: data.message4 || "",
    message5: data.message5 || "",
    minDelay: data.minDelay,
    maxDelay: data.maxDelay,
    tagsToAdd: data.tagsToAdd || "",
    kanbanStageId: data.kanbanStageId || null,
    tenantId
  });

  // 2. Associate WhatsApps
  if (data.whatsappIds && data.whatsappIds.length > 0) {
    const whatsappAssociations = data.whatsappIds.map(wId => ({
      campaignId: campaign.id,
      whatsappId: wId
    }));
    await CampaignWhatsapp.bulkCreate(whatsappAssociations);
  }

  // 3. Populate target audience
  let targetContacts: { number: string; name: string }[] = [];

  if (data.audienceSource === "base") {
    const contactWhere: any = { tenantId, isGroup: false };

    if (data.tagsFilter && data.tagsFilter.trim() !== "") {
      const filters = data.tagsFilter.split(",").map(f => f.trim());
      const filterConditions = filters.map(f => ({
        tags: { [Op.like]: `%${f}%` }
      }));
      contactWhere[Op.or] = filterConditions;
    }

    const contacts = await Contact.findAll({ where: contactWhere });
    targetContacts = contacts.map(c => ({
      number: c.number,
      name: c.name
    }));
  } else if (data.audienceSource === "import" && data.importedContacts) {
    const lines = data.importedContacts.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(",");
      const rawNum = parts[0].replace(/[^0-9]/g, "");
      const contactName = parts[1] ? parts[1].trim() : rawNum;

      if (rawNum.length >= 8) {
        targetContacts.push({
          number: rawNum,
          name: contactName
        });
      }
    }
  }

  // Ensure contact records exist in db and bulk create campaign targets
  if (targetContacts.length > 0) {
    const contactsData = [];

    for (const target of targetContacts) {
      // Create contact record if missing, so we can associate it
      let dbContact = await Contact.findOne({
        where: { number: target.number, tenantId }
      });

      if (!dbContact) {
        dbContact = await CreateOrUpdateContactService({
          name: target.name || target.number,
          number: target.number,
          isGroup: false,
          tenantId
        });
      }

      contactsData.push({
        campaignId: campaign.id,
        contactId: dbContact.id,
        number: target.number,
        name: target.name || dbContact.name || target.number,
        status: "pending"
      });
    }

    await CampaignContact.bulkCreate(contactsData);
  }

  // Reload campaign with relations
  const reloaded = await Campaign.findByPk(campaign.id, {
    include: [
      { model: Whatsapp, as: "whatsapps" },
      { model: CampaignContact, as: "contacts" }
    ]
  });

  return res.status(201).json(reloaded);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const data: CampaignData = req.body;

  const campaign = await Campaign.findOne({ where: { id, tenantId } });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  if (campaign.status === "running") {
    throw new AppError("ERR_CAMPAIGN_RUNNING", 400);
  }

  await campaign.update({
    name: data.name !== undefined ? data.name : campaign.name,
    message1: data.message1 !== undefined ? data.message1 : campaign.message1,
    message2: data.message2 !== undefined ? data.message2 : campaign.message2,
    message3: data.message3 !== undefined ? data.message3 : campaign.message3,
    message4: data.message4 !== undefined ? data.message4 : campaign.message4,
    message5: data.message5 !== undefined ? data.message5 : campaign.message5,
    minDelay: data.minDelay !== undefined ? data.minDelay : campaign.minDelay,
    maxDelay: data.maxDelay !== undefined ? data.maxDelay : campaign.maxDelay,
    tagsToAdd: data.tagsToAdd !== undefined ? data.tagsToAdd : campaign.tagsToAdd,
    kanbanStageId: data.kanbanStageId !== undefined ? data.kanbanStageId : campaign.kanbanStageId
  });

  // Re-associate whatsapps
  if (data.whatsappIds !== undefined) {
    await CampaignWhatsapp.destroy({ where: { campaignId: campaign.id } });
    if (data.whatsappIds.length > 0) {
      const whatsappAssociations = data.whatsappIds.map(wId => ({
        campaignId: campaign.id,
        whatsappId: wId
      }));
      await CampaignWhatsapp.bulkCreate(whatsappAssociations);
    }
  }

  const reloaded = await Campaign.findByPk(campaign.id, {
    include: [
      { model: Whatsapp, as: "whatsapps" },
      { model: CampaignContact, as: "contacts" }
    ]
  });

  return res.status(200).json(reloaded);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const campaign = await Campaign.findOne({ where: { id, tenantId } });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  await campaign.destroy();

  return res.status(200).json({ message: "Campaign deleted" });
};

export const start = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const campaign = await Campaign.findOne({ where: { id, tenantId } });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  await campaign.update({ status: "running" });

  return res.status(200).json(campaign);
};

export const pause = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const campaign = await Campaign.findOne({ where: { id, tenantId } });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  await campaign.update({ status: "paused" });

  return res.status(200).json(campaign);
};
