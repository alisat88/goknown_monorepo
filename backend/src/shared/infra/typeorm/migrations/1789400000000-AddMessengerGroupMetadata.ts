import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessengerGroupMetadata1789400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('conversations', [
      new TableColumn({ name: 'type', type: 'varchar', default: "'direct'" }),
      new TableColumn({ name: 'name', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'created_by', type: 'uuid', isNullable: true }),
    ]);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('conversations', [
      'created_by',
      'name',
      'type',
    ]);
  }
}
