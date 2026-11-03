/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configs')
class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enableCreateUser: boolean;
}

export default Config;
