import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGroupsUsersTable1635298073018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'groups_users',
        columns: [
          {
            name: 'group_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'usershared_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'groups_users',
      new TableForeignKey({
        name: 'GUGroups_FK',
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'groups',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'groups_users',
      new TableForeignKey({
        name: 'GUUsers_FK',
        columnNames: ['usershared_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('groups_users');
  }
}
