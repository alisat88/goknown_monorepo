import 'reflect-metadata';
import 'dotenv/config';

import '@shared/infra/typeorm';

import { getConnection } from 'typeorm';

const runDeleteQueries = async () => {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();

  // Start transaction
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`DELETE FROM auditlogs;`);
    await queryRunner.query(`DELETE FROM conversations;`);

    await queryRunner.query(`DELETE FROM dataforms_groups;`);
    await queryRunner.query(`DELETE FROM dataformsstructures;`);
    await queryRunner.query(`DELETE FROM dataformsrecords;`);
    await queryRunner.query(`DELETE FROM dataforms;`);
    await queryRunner.query(`DELETE FROM digitalassets;`);

    await queryRunner.query(`DELETE FROM folders_users;`);
    await queryRunner.query(`DELETE FROM folders_groups;`);
    await queryRunner.query(`DELETE FROM folders;`);

    await queryRunner.query(`DELETE FROM groups_users;`);
    await queryRunner.query(`DELETE FROM organizationsrooms_users;`);
    await queryRunner.query(`DELETE FROM organizations_users;`);
    await queryRunner.query(`DELETE FROM rooms_dls;`);
    await queryRunner.query(`DELETE FROM groups;`);
    await queryRunner.query(`DELETE FROM organizationsrooms;`);
    await queryRunner.query(`DELETE FROM organizationsgroups;`);

    await queryRunner.query(`DELETE FROM organizations;`);

    await queryRunner.query(`DELETE FROM recipients;`);
    await queryRunner.query(`DELETE FROM transactions;`);
    await queryRunner.query(`DELETE FROM charges;`);
    await queryRunner.query(`DELETE FROM user_tokens;`);

    // Delete users with exceptions
    await queryRunner.query(
      `DELETE FROM users u WHERE u.email NOT IN('developer1@mindwebsolutions.com','leo@mindwebsolutions.com', 'developer@mindwebsolutions.com');`,
    );

    // Commit transaction if everything went well
    console.log('Success');
    await queryRunner.commitTransaction();
  } catch (error) {
    // In case of error, perform rollback
    await queryRunner.rollbackTransaction();
    console.error('Error executing delete queries: ', error);
  } finally {
    // Close QueryRunner to release resources
    await queryRunner.release();
  }
};

export default runDeleteQueries;
