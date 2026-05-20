import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEditableFolder1634914979748 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'folders',
      new TableColumn({
        name: 'editable',
        type: 'boolean',
        default: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('folders', 'editable');
  }
}
