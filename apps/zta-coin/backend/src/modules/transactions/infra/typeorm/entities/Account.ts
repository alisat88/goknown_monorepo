import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("accounts")
class Account {

  @PrimaryColumn()
 id: string;

  @Column("float")
  balance: number;
}

export { Account };