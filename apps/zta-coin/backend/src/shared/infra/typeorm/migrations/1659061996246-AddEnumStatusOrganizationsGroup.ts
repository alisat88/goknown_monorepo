import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnumStatusOrganizationsGroup1659061996246
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizationsgroups',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['active', 'inactive'],
        enumName: 'statusGroupEnum',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
