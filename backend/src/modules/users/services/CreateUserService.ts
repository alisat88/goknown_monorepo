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
import IPinProvider from '../providers/PinProvider/models/IPinProvider';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import { EnumStatus } from '@modules/transactions/infra/typeorm/entities/Transaction';
import CreateFolderService from '@modules/digitalassets/services/CreateFolderService';
import IConfigsRepository from '@modules/configs/repositories/IConfigsRepository';

interface IRequest {
  name: string;
  email: string;
  password: string;
  sync_id?: string;
  pin?: string;
  role?: EnumRole;
}

@injectable()
class CreateUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    // connection with transaction data repo (db) connection
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,

    @inject('PinProvider')
    private pinProvider: IPinProvider,

    @inject('ConfigsRepository')
    private configsRepository: IConfigsRepository,
  ) { }

  public async execute({
    name,
    email,
    password,
    sync_id,
    pin,
    role = EnumRole.Buyer,
  }: IRequest): Promise<any> {
    // eslint-disable-next-line prettier/prettier
    const unAliasesEmail = email.replace(/(\+.*)(?=\@)/, '').toLocaleLowerCase();

    // check if user exists find by email
    const checkUserExists = await this.usersRepository.findByEmail(
      unAliasesEmail,
    );

    // if email exists throw error
    if (checkUserExists) {
      throw new AppError('Email address already used');
    }

    // generate password encrypted
    const hashedPassword = await this.hashProvider.generateHash(password);

    // generate pin if not exists
    if (!pin) {
      pin = await this.pinProvider.generatePin();
    }
    console.log('pin=====>', pin);
    const hashedPin = await this.hashProvider.generateHash(pin);

    // get config global settings to create new user enabled
    const config = await this.configsRepository.findLast();

    const enableCreateUser =
      process.env.ENABLE_CREATE_USER === 'true'
        ? true
        : !!config && config.enableCreateUser
          ? config.enableCreateUser
          : false;

    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    const status =
      enableCreateUser === true
        ? canSendEmail
          ? EnumStatusUser.ConfirmEmail
          : EnumStatusUser.Active
        : EnumStatusUser.Inactive;

    // create new user
    const user = await this.usersRepository.create({
      name,
      email: unAliasesEmail.toLocaleLowerCase(),
      password: hashedPassword,
      pin: hashedPin,
      pin_created_at: new Date(),
      twoFactorAuthentication: enableCreateUser,
      sync_id,
      status,
      role,
    } as User);

    // create digital assets folder
    // TODO: CERTIFICAR QUE ISSO TA FUNCIONANDO, INCLUSIVE EM TODOS OS NODES
    // const createFolder = container.resolve(CreateFolderService);
    // await createFolder.execute({
    //   name: 'My Personal Folder',
    //   user_syncid: user.sync_id,
    //   sync_id: user.sync_id,
    //   editable: false,
    // });

    // create Charge
    // const createCharge = container.resolve(CreateChargeService);
    // await createCharge.execute({
    //   amount: 1000.0,
    //   method: EnumMethod.Fake,
    //   user_id: user.sync_id,
    //   sync_id: sync_id,
    // });
    // Search for the user's latest transactions, as there are only 1 transaction after creation,
    // use an existing method and take the 1 position of the array
    // const createdTrasaction =
    //   await this.transactionsRepository.findLatestTransactions(user.id, null);
    // // console.log(createdTrasaction);
    // // case have value
    // if (createdTrasaction) {
    //   // get first position of array
    //   const transaction = createdTrasaction[0];
    //   // changes status value to approved

    //   transaction.status = EnumStatus.Approved;
    //   // save changes
    //   await this.transactionsRepository.save(transaction);
    // }

    user.pin = pin;
    return user;
  }
}

export default CreateUserService;
