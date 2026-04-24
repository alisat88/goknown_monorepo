import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class CreateUsers1604265252592 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'avatar',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'twoFactorAuthentication',
            type: 'boolean',
            default: true,
          },
          {
            name: 'twoFactorAuthenticationCode',
            type: 'varchar',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['buyer', 'seller', 'issuer'],
            enumName: 'roleEnum',
            default: `'buyer'`,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'confirm_email', 'inactive', 'pending'],
            enumName: 'statusEnum',
            default: `'confirm_email'`,
          },
          {
            name: 'pin',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pin_created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
