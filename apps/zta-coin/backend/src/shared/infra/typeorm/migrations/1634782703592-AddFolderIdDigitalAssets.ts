import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddFolderIdDigitalAssets1634782703592
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'digitalassets',
      new TableColumn({
        name: 'folder_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'digitalassets',
      new TableForeignKey({
        columnNames: ['folder_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'folders',
        name: 'DigitalAssetsUsers_FK',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('digitalassets', 'DigitalAssetsUsers_FK');
    await queryRunner.dropColumn('digitalassets', 'folder_id');
  }
}
