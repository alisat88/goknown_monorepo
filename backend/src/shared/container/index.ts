import { container } from 'tsyringe';

import '@modules/users/providers';
import '@modules/digitalassets/providers';
import './providers';

import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import UsersRepository from '@modules/users/infra/typeorm/repositories/UsersRepository';

import IRecipientsUsersRepository from '@modules/users/repositories/IRecipientsUsersRepository';
import RecipientsUsersRepository from '@modules/users/infra/typeorm/repositories/RecipientsUsersRepository';

import IChargesRepository from '@modules/charges/repositories/IChargesRepository';
import ChargesRepository from '@modules/charges/infra/typeorm/repositories/ChargesRepository';

import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import TransactionsRepository from '@modules/transactions/infra/typeorm/repositories/TransactionsRepeository';

import IUsersTokensRepository from '@modules/users/repositories/IUsersTokensRepository';
import UsersTokenRepository from '@modules/users/infra/typeorm/repositories/UsersTokenRepository';

import IDigitalAssetsRepository from '@modules/digitalassets/repositories/IDigitalAssetsRepository';
import DigitalAssetsRepository from '@modules/digitalassets/infra/typeorm/repositories/DigitalAssetsRepository';

import IFoldersRepository from '@modules/digitalassets/repositories/IFoldersRepository';
import FoldersRepository from '@modules/digitalassets/infra/typeorm/repositories/FoldersRepository';

import IGroupsRepository from '@modules/groups/repositories/IGroupsRepository';
import GroupsRepository from '@modules/groups/infra/typeorm/repositories/GroupsRepository';

import IConfigsRepository from '@modules/configs/repositories/IConfigsRepository';
import ConfigsRepository from '@modules/configs/infra/typeorm/repositories/ConfigsRepository';

import IDataFormsRepository from '@modules/dataforms/repositories/IDataFormsRepository';
import DataFormsRepository from '@modules/dataforms/infra/typeorm/repositories/DataFormsRepository';

import IDataFormStructuresRepository from '@modules/dataforms/repositories/IDataFormStructuresRepository';
import DataFormStructuresRepository from '@modules/dataforms/infra/typeorm/repositories/DataFormStructuresRepository';

import IDataFormRecordsRepository from '@modules/dataforms/repositories/IDataFormRecordsRepository';
import DataFormRecordsRepository from '@modules/dataforms/infra/typeorm/repositories/DataFormRecordsRepository';

import IConversationsRepository from '@modules/messanger/repositories/IConversationsRepository';
import ConversationsRepository from '@modules/messanger/infra/typeorm/repositories/ConversationsRepository';

import IMessagesRepository from '@modules/messanger/repositories/IMessagesRepository';
import MessagesRepository from '@modules/messanger/infra/typeorm/repositories/MessagesRepository';

import IDLsRepository from '@modules/dls/repositories/IDLsRepository';
import DLsRepository from '@modules/dls/infra/typeorm/repositories/DLsRepository';

import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import OrganizationRepository from '@modules/organizations/infra/typeorm/repositories/OrganizationsRepository';

import IOrganizationsUsersRepository from '@modules/organizations/repositories/IOrganizationsUsersRepository';
import OrganizationsUsersRepository from '@modules/organizations/infra/typeorm/repositories/OrganizationsUsersRepository';

import IOrganizationsGroupsRepository from '@modules/organizations/repositories/IGroupsRepository';
import OrganizationsGroupsRepository from '@modules/organizations/infra/typeorm/repositories/GroupsRepository';

import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';
import OrganizationsRoomsRepository from '@modules/organizations/infra/typeorm/repositories/RoomsRepository';

import ICurrenciesRepository from '@modules/transactions/repositories/ICurrenciesRepository';
import CurrenciesRepository from '@modules/transactions/infra/typeorm/repositories/CurrenciesRepository';

import IAuditLogsRepository from '@modules/auditlogs/repositories/IAuditLogsRepository';
import AuditLogsRepository from '@modules/auditlogs/infra/typeorm/repositories/AuditLogsRepository';

container.registerSingleton<IUsersRepository>(
  'UsersRepository',
  UsersRepository,
);

container.registerSingleton<IRecipientsUsersRepository>(
  'RecipientsUsersRepository',
  RecipientsUsersRepository,
);

container.registerSingleton<IChargesRepository>(
  'ChargesRepository',
  ChargesRepository,
);

container.registerSingleton<ITransactionsRepository>(
  'TransactionsRepository',
  TransactionsRepository,
);

container.registerSingleton<IUsersTokensRepository>(
  'UsersTokenRepository',
  UsersTokenRepository,
);

container.registerSingleton<IDigitalAssetsRepository>(
  'DigitalAssetsRepository',
  DigitalAssetsRepository,
);

container.registerSingleton<IFoldersRepository>(
  'FoldersRepository',
  FoldersRepository,
);

container.registerSingleton<IGroupsRepository>(
  'GroupsRepository',
  GroupsRepository,
);

container.registerSingleton<IConfigsRepository>(
  'ConfigsRepository',
  ConfigsRepository,
);

container.registerSingleton<IDataFormsRepository>(
  'DataFormsRepository',
  DataFormsRepository,
);

container.registerSingleton<IDataFormStructuresRepository>(
  'DataFormStructuresRepository',
  DataFormStructuresRepository,
);

container.registerSingleton<IDataFormRecordsRepository>(
  'DataFormRecordsRepository',
  DataFormRecordsRepository,
);

container.registerSingleton<IConversationsRepository>(
  'ConversationsRepository',
  ConversationsRepository,
);

container.registerSingleton<IMessagesRepository>(
  'MessagesRepository',
  MessagesRepository,
);

container.registerSingleton<IDLsRepository>('DLsRepository', DLsRepository);

container.registerSingleton<IOrganizationsRepository>(
  'OrganizationsRepository',
  OrganizationRepository,
);

container.registerSingleton<IOrganizationsUsersRepository>(
  'OrganizationsUsersRepository',
  OrganizationsUsersRepository,
);

container.registerSingleton<IOrganizationsGroupsRepository>(
  'OrganizationsGroupsRepository',
  OrganizationsGroupsRepository,
);

container.registerSingleton<IRoomsRepository>(
  'OrganizationsRoomsRepository',
  OrganizationsRoomsRepository,
);

container.registerSingleton<ICurrenciesRepository>(
  'CurrenciesRepository',
  CurrenciesRepository,
);

container.registerSingleton<IAuditLogsRepository>(
  'AuditLogsRepository',
  AuditLogsRepository,
);
