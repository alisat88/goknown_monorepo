import 'reflect-metadata';
import 'dotenv/config';

import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { createConnection, getRepository } from 'typeorm';
import { v4 as uuidv4, v5 as uuidv5, validate as uuidValidate } from 'uuid';
import { container } from 'tsyringe';

import User, {
  EnumRole,
  EnumStatus,
} from '@modules/users/infra/typeorm/entities/User';
import UserToken from '@modules/users/infra/typeorm/entities/UserToken';
import SendWelcomeInvitationEmailService from '@modules/users/services/SendWelcomeInvitationEmailService';

import '@shared/container';

interface ISeedUser {
  email: string;
  role: EnumRole;
  sendInvite: boolean;
}

const initialUsers: ISeedUser[] = [
  { email: 'atiselska@goknown.com', role: EnumRole.Admin, sendInvite: true },
  { email: 'admin@goknown.com', role: EnumRole.Admin, sendInvite: false },
];

const testAdminPassword = process.env.GOKNOWN_TEST_ADMIN_PASSWORD;
const appWebUrl = process.env.APP_WEB_URL;
const emailBypassed = process.env.MAIL_BYPASS === 'true';

function connectionUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASS || !DB_NAME) {
    throw new Error(
      'Set DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASS, and DB_NAME before running the production user seed.',
    );
  }

  return `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

function syncIdForEmail(email: string): string {
  const namespace = process.env.NODE_UUID;

  if (namespace && uuidValidate(namespace)) {
    return uuidv5(email, namespace);
  }

  return uuidv4();
}

function displayNameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function seedProductionUsers(): Promise<void> {
  if (!testAdminPassword) {
    throw new Error(
      'GOKNOWN_TEST_ADMIN_PASSWORD is required to seed admin@goknown.com.',
    );
  }

  if (!appWebUrl) {
    throw new Error('APP_WEB_URL is required to generate setup links.');
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
    const userTokensRepository = getRepository(UserToken);
    const sendWelcomeInvitationEmail = container.resolve(
      SendWelcomeInvitationEmailService,
    );

    for (const seedUser of initialUsers) {
      const email = seedUser.email.toLocaleLowerCase();
      let user = await usersRepository.findOne({ where: { email } });
      const name = user?.name || displayNameFromEmail(email);

      if (!user) {
        user = usersRepository.create({
          email,
          name,
          sync_id: syncIdForEmail(email),
          role: seedUser.role,
          status: seedUser.sendInvite ? EnumStatus.Pending : EnumStatus.Active,
          twoFactorAuthentication: true,
          password: await hash(
            seedUser.sendInvite
              ? randomBytes(32).toString('hex')
              : testAdminPassword,
            8,
          ),
        });
      } else {
        user.name = name;
        user.role = seedUser.role;
        user.sync_id = user.sync_id || syncIdForEmail(email);
        user.twoFactorAuthentication = true;

        if (seedUser.sendInvite) {
          user.status =
            user.status === EnumStatus.Active
              ? EnumStatus.Active
              : EnumStatus.Pending;
        } else {
          user.status = EnumStatus.Active;
          user.password = await hash(testAdminPassword, 8);
        }
      }

      await usersRepository.save(user);

      if (!seedUser.sendInvite) {
        console.log(`Seeded test admin login user: ${email}`);
        continue;
      }

      const userToken = userTokensRepository.create({ user_id: user.id });
      await userTokensRepository.save(userToken);

      const setupLink = `${appWebUrl.replace(/\/$/, '')}/reset-password?token=${
        userToken.token
      }`;

      if (emailBypassed) {
        console.log(`Setup link for ${email}: ${setupLink}`);
      } else {
        await sendWelcomeInvitationEmail.execute({
          email,
          name,
          invited_by: 'DAppGenius Admin',
          setup_link: setupLink,
        });
        console.log(`Sent setup invitation email to ${email}`);
      }
    }
  } finally {
    await connection.close();
  }
}

seedProductionUsers().catch(error => {
  console.error(error.message);
  process.exit(1);
});
