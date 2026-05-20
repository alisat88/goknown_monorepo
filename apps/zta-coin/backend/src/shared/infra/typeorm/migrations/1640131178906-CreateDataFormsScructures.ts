import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateDataFormsScructures1640131178906
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dataformsstructures',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'value_json',
            type: 'json',
          },
          {
            name: 'form_id',
            type: 'uuid',
          },
          {
            name: 'owner_id',
            type: 'uuid',
          },
          {
            name: 'sync_id',
            type: 'varchar',
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
      'dataformsstructures',
      new TableForeignKey({
        name: 'DFSDatafroms_FK',
        columnNames: ['form_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dataforms',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dataformsstructures');
    await queryRunner.dropForeignKey('dataformsstructures', 'DFSDatafroms_FK');
  }
}
