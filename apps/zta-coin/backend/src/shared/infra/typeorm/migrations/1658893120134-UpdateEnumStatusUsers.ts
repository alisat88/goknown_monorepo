import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumStatusUsers1658893120134 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   `ALTER TYPE "statusEnum" ADD VALUE 'pending' AFTER 'inactive'`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
