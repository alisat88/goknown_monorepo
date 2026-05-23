import 'reflect-metadata';
import 'dotenv/config';

import { hash } from 'bcryptjs';
import { createConnection, getRepository } from 'typeorm';
import { v4 as uuidv4, v5 as uuidv5, validate as uuidValidate } from 'uuid';

import User, {
  EnumRole,
  EnumStatus,
} from '@modules/users/infra/typeorm/entities/User';

const email = (
  process.env.LOCAL_TEST_USER_EMAIL || 'local.test@goknown.dev'
).toLocaleLowerCase();
const password = process.env.LOCAL_TEST_USER_PASSWORD || 'TestPassword123!';
const name = process.env.LOCAL_TEST_USER_NAME || 'Local Test User';
const pin = process.env.LOCAL_TEST_USER_PIN || '123456';

function connectionUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASS || !DB_NAME) {
    throw new Error(
      'Set DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASS, and DB_NAME before running the local user seed.',
    );
  }

  return `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

function syncIdForEmail(userEmail: string): string {
  const namespace = process.env.NODE_UUID;

  if (namespace && uuidValidate(namespace)) {
    return uuidv5(userEmail, namespace);
  }

  return uuidv4();
}

async function seedLocalUser(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_LOCAL_USER_SEED !== 'true'
  ) {
    throw new Error(
      'Refusing to seed a local user while NODE_ENV=production. Set ALLOW_LOCAL_USER_SEED=true only for a local Docker/dev database.',
    );
  }

  const connection = await createConnection({
    name: 'default',
    type: 'postgres',
    url: connectionUrl(),
    synchronize: false,
    logging: ['error', 'warn'],
    entities: ['./src/modules/**/infra/typeorm/entities/*.ts'],
    migrations: ['./src/shared/infra/typeorm/migrations/*.ts'],
    cache: false,
  });

  try {
    const usersRepository = getRepository(User);
    const existingUser = await usersRepository.findOne({ where: { email } });

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = await hash(password, 8);
      existingUser.pin = await hash(pin, 8);
      existingUser.pin_created_at = new Date();
      existingUser.sync_id = existingUser.sync_id || syncIdForEmail(email);
      existingUser.status = EnumStatus.Active;
      existingUser.twoFactorAuthentication = true;
      existingUser.role = EnumRole.Admin;

      await usersRepository.save(existingUser);
      console.log(`Local test user already exists: ${email}`);
      console.log(
        'Reset password and updated status/role/2FA flags for local login.',
      );
      return;
    }

    const user = usersRepository.create({
      name,
      email,
      password: await hash(password, 8),
      pin: await hash(pin, 8),
      pin_created_at: new Date(),
      sync_id: syncIdForEmail(email),
      status: EnumStatus.Active,
      role: EnumRole.Admin,
      twoFactorAuthentication: true,
    });

    await usersRepository.save(user);

    console.log(`Created local test user: ${email}`);
    console.log(
      'Password comes from LOCAL_TEST_USER_PASSWORD or the documented local default.',
    );
  } finally {
    await connection.close();
  }
}

seedLocalUser().catch(error => {
  console.error(error.message);
  process.exit(1);
});
