import { container, inject, injectable } from 'tsyringe';
import pLimit from 'p-limit';
import CreateTransactionService from '@modules/transactions/services/CreateTransactionService';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { v5 as uuidv5 } from 'uuid';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
// import nodes from '@config/nodes';
// import { api } from '@config/api';
import SendVoteService from '@modules/votes/services/SendVoteService';
// import { response } from 'express';

type IRequest = {
  quantity: number;
  user_sync_id: string;
  authorization: string;
};

@injectable()
class CreateTransactionLaboratoryService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    quantity,
    user_sync_id,
    authorization,
  }: IRequest): Promise<any> {
    const limit = pLimit(25);
    const promises = [];

    const createTransaction = container.resolve(CreateTransactionService);
    const syncNodeProvider = container.resolve(SyncNodeProvider);
    const sendVote = container.resolve(SendVoteService);
    const users = await this.usersRepository.findAll({ limit: 100 });

    if (!users || users.length === 0) {
      throw new Error('No users found');
    }

    for (let i = 0; i < quantity; i++) {
      promises.push(
        limit(async () => {
          // Retrieve a random user
          const randomUser = users[Math.floor(Math.random() * users.length)];

          // const id = `${user_sync_id}_${new Date().getTime()}`;
          const sync_id = uuidv5('', process.env.NODE_UUID || '');

          const body = {
            amount: '1',
            to_user_id: randomUser.sync_id,
            message: 'Transaction message',
            sync_id,
            masterNode: true as boolean | undefined,
            // timestamp: new Date().getTime(),
          };

          // Execute transaction with the required params
          const transaction = await createTransaction.execute({
            amount: body.amount,
            message: body.message,
            from_user_id: user_sync_id,
            to_user_id: body.to_user_id,
            sync_id,
            organization_id: '',
            timestamp: new Date().getTime(),
          });

          console.log('Transaction created:', transaction.transaction.id);

          const _request = {
            body,
            headers: {
              authorization: authorization,
            },
          };
          //

          if (body.masterNode) {
            delete body.masterNode;
            syncNodeProvider
              .sync({
                dapp_token_sync_id: sync_id,
                endpoint: '/me/transactions',
                request: _request as any,
                method: 'post',
              })
              .then(response => console.log(response))
              .catch(error => console.log(error));
          }

          if (transaction.vote) {
            // exec vote sending across nodes
            sendVote.execute({
              vote: transaction.vote,
              authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            });
          }
          await new Promise(resolve => {
            setTimeout(resolve, 100);
          });
        }),
      );
    }

    // Aguarda todas as promessas serem resolvidas
    await Promise.all(promises);
  }
}

export default CreateTransactionLaboratoryService;
