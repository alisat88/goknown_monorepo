import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("zta_ledger_transactions")
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

  @Column("numeric", { precision: 30, scale: 8 })
  amount: string;

  @Column("jsonb")
  before: any;

  @Column("jsonb")
  after: any;
}

export { Transaction };
