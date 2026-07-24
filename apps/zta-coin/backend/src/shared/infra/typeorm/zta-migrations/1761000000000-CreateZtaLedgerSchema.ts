import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateZtaLedgerSchema1761000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'zta_accounts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'balance',
            type: 'numeric',
            precision: 30,
            scale: 8,
            default: '0',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'zta_ledger_transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'timestamp',
            type: 'timestamptz',
          },
          {
            name: 'from',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'to',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 30,
            scale: 8,
          },
          {
            name: 'before',
            type: 'jsonb',
          },
          {
            name: 'after',
            type: 'jsonb',
          },
        ],
      }),
    );

    await queryRunner.createIndices('zta_ledger_transactions', [
      new TableIndex({
        name: 'IDX_zta_ledger_timestamp',
        columnNames: ['timestamp'],
      }),
      new TableIndex({
        name: 'IDX_zta_ledger_from',
        columnNames: ['from'],
      }),
      new TableIndex({
        name: 'IDX_zta_ledger_to',
        columnNames: ['to'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('zta_ledger_transactions');
    await queryRunner.dropTable('zta_accounts');
  }
}
