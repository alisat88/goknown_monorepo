/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessengerGroupMetadata1789400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('conversations', [
      new TableColumn({ name: 'type', type: 'varchar', default: "'direct'" }),
      new TableColumn({ name: 'name', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'created_by', type: 'uuid', isNullable: true }),
    ]);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('conversations', [
      'created_by',
      'name',
      'type',
    ]);
  }
}
