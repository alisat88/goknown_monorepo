import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrganizationsRooms1657594775834
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizationsrooms',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sync_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'admin_id',
            type: 'uuid',
          },
          {
            name: 'group_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            isNullable: true,
            type: 'timestamp',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'organizationsrooms',
      new TableForeignKey({
        name: 'OrganizationsRoomsUsers_FK',
        columnNames: ['admin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'organizationsrooms',
      new TableForeignKey({
        name: 'OrganizationsRoomsGroups_FK',
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizationsgroups',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'organizationsgroups',
      'OrganizationsRoomsUsers_FK',
    );
    await queryRunner.dropForeignKey(
      'organizationsgroups',
      'OrganizationsRoomsGroups_FK',
    );
    await queryRunner.dropTable('organizationsrooms');
  }
}
