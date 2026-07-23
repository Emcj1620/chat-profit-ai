import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  ForeignKey,
  BelongsTo,
  Default
} from "sequelize-typescript";
import Ticket from "./Ticket";
import Tenant from "./Tenant";

@Table
class KanbanStage extends Model<KanbanStage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default("#2196F3")
  @Column
  color: string;

  @Default(0)
  @Column
  position: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default KanbanStage;
