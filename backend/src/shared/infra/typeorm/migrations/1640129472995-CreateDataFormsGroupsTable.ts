/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateDataFormsGroupsTable1640129472995
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dataforms_groups',
        columns: [
          {
            name: 'dataforms_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'groupshared_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'dataforms_groups',
      new TableForeignKey({
        name: 'DFGDataForms_FK',
        columnNames: ['dataforms_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dataforms',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'dataforms_groups',
      new TableForeignKey({
        name: 'DFGGroups_FK',
        columnNames: ['groupshared_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'groups',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('folders_groups');
  }
}
