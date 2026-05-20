import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateDataFormsRecords1640131192273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dataformsrecords',
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
      'dataformsrecords',
      new TableForeignKey({
        name: 'DFRDatafroms_FK',
        columnNames: ['form_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dataforms',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dataformsrecords');
    await queryRunner.dropForeignKey('dataformsrecords', 'DFRDatafroms_FK');
  }
}
