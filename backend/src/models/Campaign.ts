import {
  Table,
  Column,
  DataType,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany
} from "sequelize-typescript";
import Tenant from "./Tenant";
import KanbanStage from "./KanbanStage";
import CampaignContact from "./CampaignContact";
import Whatsapp from "./Whatsapp";
import CampaignWhatsapp from "./CampaignWhatsapp";

@Table
class Campaign extends Model<Campaign> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  status: string;

  @Column(DataType.TEXT)
  message1: string;

  @Column(DataType.TEXT)
  message2: string;

  @Column(DataType.TEXT)
  message3: string;

  @Column(DataType.TEXT)
  message4: string;

  @Column(DataType.TEXT)
  message5: string;

  @Column
  minDelay: number;

  @Column
  maxDelay: number;

  @Column
  tagsToAdd: string;

  @ForeignKey(() => KanbanStage)
  @Column
  kanbanStageId: number;

  @BelongsTo(() => KanbanStage)
  kanbanStage: KanbanStage;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => CampaignContact)
  contacts: CampaignContact[];

  @BelongsToMany(() => Whatsapp, () => CampaignWhatsapp)
  whatsapps: Whatsapp[];
}

export default Campaign;
