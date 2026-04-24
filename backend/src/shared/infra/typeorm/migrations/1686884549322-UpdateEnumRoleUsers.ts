import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumRoleUsers1686884549322 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "roleEnum" ADD VALUE 'admin' BEFORE 'buyer'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
