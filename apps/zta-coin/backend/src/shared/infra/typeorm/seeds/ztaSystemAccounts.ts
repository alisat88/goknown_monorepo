import 'reflect-metadata';
import 'dotenv/config';

import { Account } from '@modules/transactions/infra/typeorm/entities/Account';
import { initializeDatabase } from '@shared/infra/typeorm';

export async function seedZtaSystemAccounts(): Promise<void> {
  const connection = await initializeDatabase();
  await connection
    .createQueryBuilder()
    .insert()
    .into(Account)
    .values({
      id: 'KNOWN_SYSTEM',
      balance: '0.00000000',
    })
    .onConflict('("id") DO NOTHING')
    .execute();
}

async function main(): Promise<void> {
  try {
    await seedZtaSystemAccounts();
    console.log('ZTA system accounts seeded');
    const connection = await initializeDatabase();
    await connection.close();
  } catch {
    console.error('ZTA system account seed failed');
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
