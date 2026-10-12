import { Account } from '@modules/transactions/infra/typeorm/entities/Account';
import { Transaction } from '@modules/transactions/infra/typeorm/entities/Transaction';
import { ZtaAuthSession } from '@modules/auth/entities/ZtaAuthSession';
import { ZtaHandoffTransaction } from '@modules/auth/entities/ZtaHandoffTransaction';

export const typeormEntities = [Account, Transaction, ZtaAuthSession, ZtaHandoffTransaction];
