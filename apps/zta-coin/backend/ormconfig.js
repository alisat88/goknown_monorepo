require('dotenv/config');

// Debug: Log all DB environment variables
console.log('=== TypeORM Config Debug ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASS:', process.env.DB_PASS ? '***SET***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('===========================');

// Get database name with fallback
const dbName = process.env.DB_NAME || 'defaultdb';

// Validate required environment variables (except DB_NAME which has fallback)
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASS) {
  console.error('ERROR: Required database environment variables are missing!');
  throw new Error('DB_HOST, DB_PORT, DB_USER, and DB_PASS are required');
}

// Ensure DB_NAME is not empty or just whitespace
if (!dbName.trim()) {
  console.error('ERROR: DB_NAME is empty or whitespace!');
  throw new Error('DB_NAME must not be empty');
}

const connectionUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`;

// Validate the connection URL contains a database name
if (!connectionUrl.match(/\/[^\/]+$/)) {
  console.error('ERROR: Connection URL does not contain a database name!');
  console.error('URL:', connectionUrl.replace(/:[^:@]+@/, ':***@'));
  throw new Error('Connection URL must include a database name');
}

// Final validation: ensure URL ends with a database name (not just a slash)
const urlParts = connectionUrl.split('/');
const finalDbName = urlParts[urlParts.length - 1];
if (!finalDbName || finalDbName.trim() === '') {
  console.error('ERROR: Connection URL database name is empty!');
  console.error('URL:', connectionUrl.replace(/:[^:@]+@/, ':***@'));
  throw new Error('Connection URL must include a valid database name');
}

console.log('TypeORM Config - Using database:', finalDbName);
console.log('TypeORM Config - Connection URL:', connectionUrl.replace(/:[^:@]+@/, ':***@'));

module.exports = [
  {
    name: 'default',
    type: 'postgres',
    url: connectionUrl,
    synchronize: false,
    soft: true,
    entities: ['./dist/modules/**/infra/typeorm/entities/*.js'],
    migrations: ['./dist/shared/infra/typeorm/migrations/*.js'],
    cli: {
      migrationsDir: './src/shared/infra/typeorm/migrations',
    },
    cache: false,
  },
];
