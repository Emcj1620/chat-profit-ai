import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  HasMany,
  Unique,
  ForeignKey,
  BelongsTo,
  BelongsToMany
} from "sequelize-typescript";
import Queue from "./Queue";
import Ticket from "./Ticket";
import WhatsappQueue from "./WhatsappQueue";
import Tenant from "./Tenant";
import ChatFlow from "./ChatFlow";

@Table
class Whatsapp extends Model<Whatsapp> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ChatFlow)
  @Column
  flowId: number;

  @BelongsTo(() => ChatFlow)
  flow: ChatFlow;

  @AllowNull
  @Unique
  @Column(DataType.TEXT)
  name: string;

  @Column(DataType.TEXT)
  session: string;

  @Column(DataType.TEXT)
  qrcode: string;

  @Column
  status: string;

  @Column
  battery: string;

  @Column
  plugged: boolean;

  @Column
  retries: number;

  @Column(DataType.TEXT)
  greetingMessage: string;

  @Column(DataType.TEXT)
  farewellMessage: string;

  @Default(false)
  @AllowNull
  @Column
  isDefault: boolean;

  @Default(false)
  @Column
  gptEnabled: boolean;

  @AllowNull
  @Column(DataType.TEXT)
  gptApiKey: string;

  @Default("gpt-4o-mini")
  @Column
  gptModel: string;

  @AllowNull
  @Column(DataType.TEXT)
  gptPrompt: string;

  @AllowNull
  @Column(DataType.TEXT)
  gptGuidelines: string;

  @Default(0.7)
  @Column(DataType.FLOAT)
  gptTemperature: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @BelongsToMany(() => Queue, () => WhatsappQueue)
  queues: Array<Queue & { WhatsappQueue: WhatsappQueue }>;

  @HasMany(() => WhatsappQueue)
  whatsappQueues: WhatsappQueue[];
}

export default Whatsapp;
