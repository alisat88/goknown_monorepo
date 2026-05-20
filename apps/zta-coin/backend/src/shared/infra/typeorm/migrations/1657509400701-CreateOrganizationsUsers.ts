import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrganizationsUsers1657509400701
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizations_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // {
          //   name: 'id',
          //   type: 'uuid',
          // },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'user'],
            enumName: 'roleOrgEnum',
            default: `'user'`,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'pending', 'inactive'],
            enumName: 'stutusOrgEnum',
            default: `'active'`,
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
      'organizations_users',
      new TableForeignKey({
        name: 'OrganizationsUsers_Users_FK',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'organizations_users',
      new TableForeignKey({
        name: 'OrganizationsUsers_Organizations_FK',
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'organizations_users',
      'OrganizationsUsers_Users_FK',
    );
    await queryRunner.dropForeignKey(
      'organizations_users',
      'OrganizationsUsers_Organizations_FK',
    );
    await queryRunner.dropTable('organizations_users');
  }
}
