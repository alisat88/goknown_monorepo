/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("zta_accounts")
class Account {

  @PrimaryColumn()
 id: string;

  @Column("numeric", { precision: 30, scale: 8 })
  balance: string;
}

export { Account };
