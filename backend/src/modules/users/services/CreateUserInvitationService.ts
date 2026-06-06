import { EnumMethod } from '@modules/charges/infra/typeorm/entities/Charge';
import CreateChargeService from '@modules/charges/services/CreateChargeService';
import AppError from '@shared/errors/AppError';
import { inject, injectable, container } from 'tsyringe';
import User, {
  EnumRole,
  EnumStatus as EnumStatusUser,
} from '../infra/typeorm/entities/User';
import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import { EnumStatus } from '@modules/transactions/infra/typeorm/entities/Transaction';
import CreateFolderService from '@modules/digitalassets/services/CreateFolderService';
import IUsersTokensRepository from '../repositories/IUsersTokensRepository';
import { randomBytes } from 'crypto';

interface IRequest {
  email: string;
  sync_id?: string;
  role?: EnumRole;
  amount?: number;
  name?: string;
}

interface IResponse {
  user: User;
  setupToken: string;
}

@injectable()
class CreateUserInvitationService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    // connection with transaction data repo (db) connection
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,

    @inject('UsersTokenRepository')
    private usersTokensRepository: IUsersTokensRepository,
  ) {}

  public async execute({
    email,
    sync_id,
    amount = 0,
    name = '',
    role = EnumRole.User,
  }: IRequest): Promise<IResponse> {
    const normalizedEmail = email
      .replace(/(\+.*)(?=\@)/, '')
      .toLocaleLowerCase();

    // check if user exists find by email
    const checkUserExists = await this.usersRepository.findByEmail(
      normalizedEmail,
    );

    // if email exists throw error
    if (checkUserExists) {
      throw new AppError('Email address already used');
    }

    const lockedPasswordPlaceholder = randomBytes(32).toString('hex');
    const hashedPassword = await this.hashProvider.generateHash(
      lockedPasswordPlaceholder,
    );

    const status = EnumStatusUser.Pending;
    const twoFactorAuthentication = true;
    // console.log('status');
    // console.log(status);
    // create new user
    const user = await this.usersRepository.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      twoFactorAuthentication,
      sync_id,
      status,
      role,
    } as User);

    // create digital assets folder
    // TODO: CERTIFICAR QUE ISSO TA FUNCIONANDO, INCLUSIVE EM TODOS OS NODES
    const createFolder = container.resolve(CreateFolderService);
    await createFolder.execute({
      name: 'My Personal Folder',
      user_syncid: user.sync_id,
      sync_id: user.sync_id,
      editable: false,
    });

    // create Charge
    if (amount > 0) {
      const createCharge = container.resolve(CreateChargeService);
      await createCharge.execute({
        amount: 1000.0,
        method: EnumMethod.Fake,
        user_id: user.sync_id,
      });
      // Search for the user's latest transactions, as there are only 1 transaction after creation,
      // use an existing method and take the 1 position of the array
      const createdTrasaction =
        await this.transactionsRepository.findLatestTransactions(user.id, null);
      // console.log(createdTrasaction);
      // case have value
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

    const { token } = await this.usersTokensRepository.generate(user.id);

    return { user, setupToken: token };
  }
}

export default CreateUserInvitationService;
