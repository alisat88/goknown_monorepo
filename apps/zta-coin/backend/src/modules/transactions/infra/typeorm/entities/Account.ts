import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("zta_accounts")
class Account {

  @PrimaryColumn()
 id: string;

  @Column("numeric", { precision: 30, scale: 8 })
  balance: string;
}

export { Account };
