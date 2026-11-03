/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumStatusUsers1658893120134 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   `ALTER TYPE "statusEnum" ADD VALUE 'pending' AFTER 'inactive'`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
