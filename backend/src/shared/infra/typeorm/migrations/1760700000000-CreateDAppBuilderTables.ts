import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDAppBuilderTables1760700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── dapp_builder_apps ────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'dapp_builder_apps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'owner_id',
            type: 'uuid',
          },
          {
            name: 'dapp_name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'user_prompt',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'template',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'Draft'",
          },
          {
            name: 'generated_code',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'generated_config',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'internal_app_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'permission_model',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'apis',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
          },
          {
            name: 'workflow',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'client_id',
            type: 'varchar',
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
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dapp_builder_apps',
      new TableIndex({ name: 'IDX_dba_owner_id', columnNames: ['owner_id'] }),
    );

    // FK: owner_id → users.id
    await queryRunner.createForeignKey(
      'dapp_builder_apps',
      new TableForeignKey({
        name: 'FK_dba_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ── dapp_builder_app_access ──────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'dapp_builder_app_access',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'app_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'varchar',
            default: "'Viewer'",
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
        ],
      }),
      true,
    );

    // Unique constraint: one access record per app+user pair
    await queryRunner.createIndex(
      'dapp_builder_app_access',
      new TableIndex({
        name: 'UQ_dbaa_app_user',
        columnNames: ['app_id', 'user_id'],
        isUnique: true,
      }),
    );

    // FK: app_id → dapp_builder_apps.id
    await queryRunner.createForeignKey(
      'dapp_builder_app_access',
      new TableForeignKey({
        name: 'FK_dbaa_app',
        columnNames: ['app_id'],
        referencedTableName: 'dapp_builder_apps',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // FK: user_id → users.id
    await queryRunner.createForeignKey(
      'dapp_builder_app_access',
      new TableForeignKey({
        name: 'FK_dbaa_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dapp_builder_app_access', true);
    await queryRunner.dropTable('dapp_builder_apps', true);
  }
}
