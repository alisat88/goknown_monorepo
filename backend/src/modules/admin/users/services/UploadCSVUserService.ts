import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import AppError from '@shared/errors/AppError';
import path from 'path';
import { container, inject, injectable } from 'tsyringe';
import { randomBytes } from 'crypto';

import { v5 as uuidv5 } from 'uuid';

import uploadConfig from '@config/upload';
import csvParser from 'csv-parser';
import fs from 'fs';
import User, {
  EnumRole,
  EnumStatus as EnumStatusUser,
} from '@modules/users/infra/typeorm/entities/User';
import IHashProvider from '@modules/users/providers/HashProvider/models/IHashProvider';
import CreateChargeService from '@modules/charges/services/CreateChargeService';
import { EnumMethod } from '@modules/charges/infra/typeorm/entities/Charge';
import { EnumStatus } from '@modules/transactions/infra/typeorm/entities/Transaction';
import SendWelcomeInvitationEmailService from '@modules/users/services/SendWelcomeInvitationEmailService';
import IUsersTokensRepository from '@modules/users/repositories/IUsersTokensRepository';

type IRequestDTO = {
  filename: string;
  user_sync_id: string;
  masterNode: boolean;
};

type ICSVFileDTO = {
  email: string;
  initial_tokens: number;
  role: EnumRole;
};

type IRegisteredResponse = {
  email: string;
  status: 'success' | 'error';
  message?: string;
};

type IResponse = {
  error: IRegisteredResponse[];
  sussecceful: IRegisteredResponse[];
};

@injectable()
class UploadCSVUserService {
  constructor(
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,

    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('UsersTokenRepository')
    private usersTokensRepository: IUsersTokensRepository,
  ) {}

  async execute({
    user_sync_id,
    filename,
    masterNode = false,
  }: IRequestDTO): Promise<IResponse> {
    const adminUser = await this.usersRepository.findBySyncId(user_sync_id);

    if (!adminUser) {
      throw new AppError('Only authenticated users can change avatar.', 401);
    }

    if (adminUser.role !== 'admin') {
      throw new AppError('Only admin users can upload CSV file.', 401);
    }

    // retrive file
    const filePath = path.resolve(uploadConfig.tempFolder, filename);

    if (!filePath) {
      throw new AppError('File not found.', 401);
    }
    const data: ICSVFileDTO[] = [];

    try {
      const fileContent = await fs.readFileSync(filePath, 'utf8');

      const registeredUsers = {
        error: [] as IRegisteredResponse[],
        sussecceful: [] as IRegisteredResponse[],
      };

      await new Promise<void>((resolve, reject) => {
        // Use o csvParser para processar o conteúdo do arquivo CSV
        const parser = csvParser({ separator: ';' });

        parser.on('data', row => {
          data.push(row);
        });

        parser.on('end', () => {
          resolve();
        });

        parser.on('error', error => {
          reject(error);
        });

        parser.write(fileContent);
        parser.end();
      });

      // console.log('Dados extraídos do CSV:', data);
      if (data.length > 101) {
        throw new AppError('CSV file must have 100 or less registers.', 401);
      }

      if (!process.env.APP_WEB_URL) {
        throw new AppError(
          'APP_WEB_URL is required to generate invitation setup links.',
        );
      }

      // save data on database

      const promises = data.map(async row => {
        const { email, initial_tokens, role } = row;
        const user = await this.usersRepository.findByEmail(email);

        if (user) {
          registeredUsers.error.push({
            email: email,
            status: 'error',
            message: 'User already exists.',
          });
          return;
        }

        const lockedPasswordPlaceholder = randomBytes(32).toString('hex');
        const hashedPassword = await this.hashProvider.generateHash(
          lockedPasswordPlaceholder,
        );

        const sync_id = uuidv5(email || '', process.env.NODE_UUID || '');
        // create new user
        const newUser = await this.usersRepository.create({
          email: email.toLocaleLowerCase(),
          password: hashedPassword,
          twoFactorAuthentication: true,
          sync_id,
          status: EnumStatusUser.Pending,
          role,
        } as User);

        newUser.sync_id = sync_id;

        if (initial_tokens > 0) {
          const createCharge = container.resolve(CreateChargeService);
          await createCharge.execute({
            amount: 1000.0,
            method: EnumMethod.Fake,
            user_id: newUser.sync_id,
          });

          const createdTrasaction =
            await this.transactionsRepository.findLatestTransactions(
              newUser.id,
              null,
            );

          if (createdTrasaction && createdTrasaction.length > 0) {
            // get first position of array
            const transaction = createdTrasaction[0];
            console.log(createdTrasaction);
            // changes status value to approved
            transaction.status = EnumStatus.Approved;
            // save changes
            await this.transactionsRepository.save(transaction);
          }
        }

        const { token } = await this.usersTokensRepository.generate(newUser.id);
        const setupLink = `${process.env.APP_WEB_URL.replace(
          /\/$/,
          '',
        )}/reset-password?token=${token}`;

        if (masterNode && process.env.MAIL_BYPASS !== 'true') {
          const sendWelcome = container.resolve(
            SendWelcomeInvitationEmailService,
          );
          await sendWelcome.execute({
            email,
            name: newUser.name || 'User',
            setup_link: setupLink,
            invited_by: adminUser.name,
          });
        } else if (masterNode) {
          console.log(`Setup link for ${email}: ${setupLink}`);
        }
        registeredUsers.sussecceful.push({
          email: email,
          status: 'success',
          message: 'User created successfully',
        });
      });

      await Promise.all(promises);

      await this.storageProvider.deleteFile(filename);

      return registeredUsers;

      // You can process the data as needed here
    } catch (error) {
      console.error('Error on reading CSV file:', error);
      throw new AppError('Error on reading CSV file:', 500);
    }
  }
}

export default UploadCSVUserService;
