import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("transactions")
class Transaction {

  @PrimaryColumn()
  id: string;

  @Column()
  type: string;

  @Column()
  timestamp: Date;

  @Column({ nullable: true })
  from?: string;

  @Column({ nullable: true })
  to?: string;

  @Column("float")
  amount: number;

  @Column("json")
  before: any;

  @Column("json")
  after: any;
}

export { Transaction };