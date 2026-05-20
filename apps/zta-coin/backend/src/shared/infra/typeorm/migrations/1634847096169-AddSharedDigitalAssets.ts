import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSharedDigitalAssets1634847096169 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'digitalassets',
      new TableColumn({
        name: 'shared',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('digitalassets', 'shared');
  }
}
