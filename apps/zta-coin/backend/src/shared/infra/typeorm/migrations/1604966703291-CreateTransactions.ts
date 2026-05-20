import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export default class CreateTransactions1604966703291
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['transaction', 'charge'],
            enumName: 'categoryEnum',
          },
          {
            name: 'transactionType',
            type: 'enum',
            enum: ['sent', 'received'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'unpproved', 'failed'],
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'message',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'to_user_id',
            type: 'uuid',
          },
          {
            name: 'from_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'charge_id',
            type: 'uuid',
            isNullable: true,
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
          {
            name: 'sync_id',
            type: 'uuid',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'TransactionsToUser',
        columnNames: ['to_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'TransactionsFromUser',
        columnNames: ['from_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'TransactionsCharge',
        columnNames: ['charge_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'charges',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('transactions', 'TransactionsToUser');
    await queryRunner.dropForeignKey('transactions', 'TransactionsFromUser');
    await queryRunner.dropForeignKey('transactions', 'TransactionsCharge');
    await queryRunner.dropTable('transactions');
  }
}
