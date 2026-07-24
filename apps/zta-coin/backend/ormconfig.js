require('dotenv/config');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }

  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Local database configuration is incomplete: missing ${missing.join(', ')}`);
  }

  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

function loadZtaEntities() {
  const { Account } = require('./dist/modules/transactions/infra/typeorm/entities/Account');
  const { Transaction } = require('./dist/modules/transactions/infra/typeorm/entities/Transaction');
  return [Account, Transaction];
}

module.exports = [
  {
    name: 'default',
    type: 'postgres',
    url: resolveDatabaseUrl(),
    synchronize: false,
    dropSchema: false,
    entities: loadZtaEntities(),
    migrations: ['./dist/shared/infra/typeorm/zta-migrations/*.js'],
    migrationsTableName: 'zta_typeorm_migrations',
    cli: {
      migrationsDir: './src/shared/infra/typeorm/zta-migrations',
    },
    cache: false,
  },
];
