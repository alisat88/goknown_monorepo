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

export class CreateOrganizationsRoomsUsers1657596996616
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizationsrooms_users',
        columns: [
          { name: 'organizationuser_id', type: 'uuid', isPrimary: true },
          { name: 'room_id', type: 'uuid', isPrimary: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'organizationsrooms_users',
      new TableForeignKey({
        name: 'ORU_Rooms_FK',
        columnNames: ['room_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizationsrooms',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'organizationsrooms_users',
      new TableForeignKey({
        name: 'ORU_Users_FK',
        columnNames: ['organizationuser_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations_users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'organizationsrooms_users',
      'ORU_Rooms_FK',
    );
    await queryRunner.dropForeignKey(
      'organizationsrooms_users',
      'ORU_Users_FK',
    );
    await queryRunner.dropTable('organizationsrooms_users');
  }
}
