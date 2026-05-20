import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFoldersGroupsTable1635297075618
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'folders_groups',
        columns: [
          {
            name: 'folder_id',
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
      'folders_groups',
      new TableForeignKey({
        name: 'FDGFolder_FK',
        columnNames: ['folder_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'folders',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'folders_groups',
      new TableForeignKey({
        name: 'FDGGroups_FK',
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
