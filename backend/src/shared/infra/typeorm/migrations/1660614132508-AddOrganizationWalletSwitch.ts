import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrganizationWalletSwitch1660614132508
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'enableWallet',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'enableWallet');
  }
}
