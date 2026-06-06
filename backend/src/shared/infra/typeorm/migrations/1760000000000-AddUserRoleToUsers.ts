import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleToUsers1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "roleEnum" ADD VALUE IF NOT EXISTS 'user'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
