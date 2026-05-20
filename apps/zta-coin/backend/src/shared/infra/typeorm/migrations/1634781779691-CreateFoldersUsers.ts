import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFoldersUsers1634781779691 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'folders_users',
        columns: [
          {
            name: 'folder_id',
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
      'folders_users',
      new TableForeignKey({
        name: 'FDGFolder_FK',
        columnNames: ['folder_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'folders',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'folders_users',
      new TableForeignKey({
        name: 'FDGUsers_FK',
        columnNames: ['usershared_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('folders_users');
  }
}
