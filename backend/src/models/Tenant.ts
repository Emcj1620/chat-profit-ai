import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  HasMany
} from "sequelize-typescript";
import User from "./User";
import Whatsapp from "./Whatsapp";
import Contact from "./Contact";
import Ticket from "./Ticket";
import Message from "./Message";
import Queue from "./Queue";
import QuickAnswer from "./QuickAnswer";
import Setting from "./Setting";

@Table
class Tenant extends Model<Tenant> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  subscriptionStatus: string;

  @Column
  dueDate: Date;

  @Column
  maxUsers: number;

  @Column
  maxConnections: number;

  @Column
  planId: number;

  @Column
  asaasCustomerId: string;

  @Column
  stripeCustomerId: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Whatsapp)
  whatsapps: Whatsapp[];

  @HasMany(() => Contact)
  contacts: Contact[];

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => Message)
  messages: Message[];

  @HasMany(() => Queue)
  queues: Queue[];

  @HasMany(() => QuickAnswer)
  quickAnswers: QuickAnswer[];

  @HasMany(() => Setting)
  settings: Setting[];
}

export default Tenant;
