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

export class CreateRoomsDls1657596665209 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rooms_dls',
        columns: [
          {
            name: 'room_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'dl_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'rooms_dls',
      new TableForeignKey({
        name: 'RoomsDLs_Rooms_FK',
        columnNames: ['room_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizationsrooms',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'rooms_dls',
      new TableForeignKey({
        name: 'RoomsDLs_DLs_FK',
        columnNames: ['dl_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dls',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('rooms_dls', 'RoomsDLs_Rooms_FK');
    await queryRunner.dropForeignKey('rooms_dls', 'RoomsDLs_DLs_FK');
    await queryRunner.dropTable('rooms_dls');
  }
}
