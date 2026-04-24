import { createConnection } from 'typeorm';

async function deleteData() {
  try {
    // Connect to database
    const connection = await createConnection();

    // Execute delete queries
    await connection.query('DELETE FROM auditlogs');
    await connection.query('DELETE FROM charges');
    await connection.query('DELETE FROM conversations');
    await connection.query('DELETE FROM currencies');
    await connection.query('DELETE FROM dataforms_groups');
    await connection.query('DELETE FROM dataformsstructures');
    await connection.query('DELETE FROM dataformsrecords');
    await connection.query('DELETE FROM dataforms');
    await connection.query('DELETE FROM digitalassets');
    await connection.query('DELETE FROM folders_users');
    await connection.query('DELETE FROM folders_groups');
    await connection.query('DELETE FROM folders');
    await connection.query('DELETE FROM groups_users');
    await connection.query('DELETE FROM groups');
    await connection.query('DELETE FROM organizationsrooms_users');
    await connection.query('DELETE FROM organizations_users');
    await connection.query('DELETE FROM rooms_dls');
    await connection.query('DELETE FROM organizationsgroups');
    await connection.query('DELETE FROM organizationsrooms');
    await connection.query('DELETE FROM organizations');
    await connection.query('DELETE FROM recipients');
    await connection.query('DELETE FROM transactions');
    await connection.query('DELETE FROM user_tokens');
    await connection.query('DELETE FROM users');

    // Close database connection
    await connection.close();

    console.log('Data deleted successfully.');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

// Execute function to delete data
deleteData();
