import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWelcomeBooleanInFolders1722195761838
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'folders',
      new TableColumn({
        name: 'welcome',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('folders', 'welcome');
  }
}
