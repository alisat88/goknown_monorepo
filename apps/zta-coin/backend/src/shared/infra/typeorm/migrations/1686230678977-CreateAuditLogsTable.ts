import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAuditLogsTable1686230678977 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auditlogs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sync_id',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'dapp',
            type: 'varchar',
          },
          {
            name: 'dapp_token',
            type: 'varchar',
          },
          {
            name: 'dapp_token_sync_id',
            type: 'varchar',
          },
          {
            name: 'leader_node',
            type: 'varchar',
          },
          {
            name: 'nodes',
            type: 'jsonb',
            isNullable: true,
            isArray: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
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
            onUpdate: 'now()',
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
      'auditlogs',
      new TableForeignKey({
        name: 'AuditlogsUsers',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('auditlogs', 'AuditlogsUsers');
    await queryRunner.dropTable('auditlogs');
  }
}
