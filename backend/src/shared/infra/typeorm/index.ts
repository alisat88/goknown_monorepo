import { createConnection, ConnectionOptions } from 'typeorm';
import 'dotenv/config';

// Check if environment variables are defined
console.log('>>> TypeORM Connection Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);

// Validate required environment variables
if (!process.env.DB_NAME) {
  throw new Error('DB_NAME environment variable is not set!');
}

// Build connection URL
const connectionUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Attempting connection with URL:', connectionUrl.replace(/:[^:@]+@/, ':***@'));

const config: ConnectionOptions = {
  name: 'default',
  type: 'postgres',
  url: connectionUrl,
  synchronize: false,
  logging: ['error', 'schema', 'warn'],
  entities: [
    process.env.NODE_ENV === 'production'
      ? './dist/modules/**/infra/typeorm/entities/*.js'
      : './src/modules/**/infra/typeorm/entities/*.ts',
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? './dist/shared/infra/typeorm/migrations/*.js'
      : './src/shared/infra/typeorm/migrations/*.ts',
  ],
  cli: {
    migrationsDir: './src/shared/infra/typeorm/migrations',
  },
  cache: false,
};

createConnection(config)
  .then(() => console.log('DB CONNECTED'))
  .catch(error => console.log('DB CONNECTION ERROR', error));
