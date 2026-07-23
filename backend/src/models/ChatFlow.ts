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
  Default
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Whatsapp from "./Whatsapp";
import Ticket from "./Ticket";

@Table
class ChatFlow extends Model<ChatFlow> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column(DataType.TEXT)
  flowData: string;

  @Default(true)
  @Column
  isActive: boolean;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Whatsapp)
  whatsapps: Whatsapp[];

  @HasMany(() => Ticket)
  tickets: Ticket[];
}

export default ChatFlow;
