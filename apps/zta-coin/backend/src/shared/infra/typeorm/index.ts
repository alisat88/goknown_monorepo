import 'reflect-metadata';
import { createConnection, ConnectionOptions } from 'typeorm';
import 'dotenv/config';

import { typeormEntities } from './entities';

// Debug logs
console.log('>>> TypeORM Connection Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Build connection URL
const connectionUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log(
  'Attempting connection with URL:',
  connectionUrl.replace(/:[^:@]+@/, ':***@')
);

const config: ConnectionOptions = {
  name: 'default',
  type: 'postgres',
  url: connectionUrl,

  synchronize: true,
  logging: ['error', 'schema', 'warn'],

  entities: typeormEntities,

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

// 🚀 Initialize DB connection
createConnection(config)
  .then(conn => {
    console.log('DB CONNECTED');

    // ✅ Debug: confirm entities registered
    console.log(
      'Registered entities:',
      conn.entityMetadatas.map(e => e.name)
    );
  })
  .catch(error => console.log('DB CONNECTION ERROR', error));
