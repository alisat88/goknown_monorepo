import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export default class CreateRecipientTable1604351244303
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'recipients',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'recipient_id',
            type: 'uuid',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'recipients',
      new TableForeignKey({
        name: 'UsersRecipients',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'recipients',
      new TableForeignKey({
        name: 'RecipientsUsers',
        columnNames: ['recipient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('recipients', 'UsersRecipients');

    await queryRunner.dropForeignKey('recipients', 'RecipientsUsers');

    await queryRunner.dropTable('recipients');
  }
}
