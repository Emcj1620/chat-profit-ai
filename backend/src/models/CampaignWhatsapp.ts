import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  ForeignKey,
  PrimaryKey
} from "sequelize-typescript";
import Campaign from "./Campaign";
import Whatsapp from "./Whatsapp";

@Table
class CampaignWhatsapp extends Model<CampaignWhatsapp> {
  @ForeignKey(() => Campaign)
  @PrimaryKey
  @Column
  campaignId: number;

  @ForeignKey(() => Whatsapp)
  @PrimaryKey
  @Column
  whatsappId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CampaignWhatsapp;
