import { container, inject, injectable } from 'tsyringe';

import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';

import IVoteDTO from '../infra/dtos/IVoteDTO';
import nodes from '@config/nodes';
import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';
import ApprovedTransactionVoteService from '@modules/transactions/services/ApprovedTransactionVoteService';
import UnApprovedTransactionVoteService from '@modules/transactions/services/UnApprovedTransactionVoteService';

@injectable()
class ReceivedVoteService {
  constructor(
    // connection with transaction data repo (db) connection
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,
    // connection with memory db
    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,
  ) {}

  // exec the voting service function
  public async execute(vote: IVoteDTO): Promise<void> {
    // console.log(
    //   'received ==>',
    //   vote.syncId,
    //   vote.nodeName,
    //   vote.timestamp,
    //   vote.type,
    // );
    try {
      // verify type of vote this case if it is a transaction
      if (vote.type === 'transaction') {
        // use sync_id number to lookup transaction on db
        // const transaction = await this.transactionsRepository.findBySyncId(
        //   vote.syncId,
        // );

        // verify if transaction exists on db
        if (vote.syncId) {
          // create memory key
          const memoryKey = `transaction-vote:${vote.syncId}-${vote.toUserSyncId}-${vote.fromUserSyncId}`;

          // retrieve votes previously saved on memory
          const votes =
            (await this.memoryProvider.recover<IVoteDTO[]>(memoryKey)) || [];
          await this.memoryProvider.save(memoryKey, [...votes, vote]);
          // verify if vote exists
          // const hasVoteNode = !!votes.find(v => v.nodeName === vote.nodeName);
          // if vote doesn't exist add a new vote
          // if (hasVoteNode === false) {
          votes.push(vote);
          // }
          // console.log('memoryKey====>', memoryKey);
          // console.log('votes after add', votes);

          // verify if the number of votes is the same as the number of nodes

          if (votes.length === nodes.length + 1) {
            // verify if all votes are approved
            const isApproved = votes.every(item => item.vote === 'approved');
            if (isApproved) {
              const approvedTransaction = container.resolve(
                ApprovedTransactionVoteService,
              );
              // update transaction to approved across nodes
              await approvedTransaction.execute(vote.syncId);
            } else {
              // case one of the nodes return unapproved
              const unApprovedTransaction = container.resolve(
                UnApprovedTransactionVoteService,
              );
              // removed duplicated error messages
              const failedMessages = new Set(votes.map(vote => vote.error));

              await unApprovedTransaction.execute(
                vote.syncId,
                Array.from(failedMessages),
              );
            }
          }
        }
      }

      console.log('try add', vote);
      console.log(
        'all votes',
        (await this.memoryProvider.recoverPrefix<IVoteDTO[]>(
          'transaction-vote',
        )) || [],
      );
    } catch (err) {
      console.log('AQUIIIIIII RECEIVED VOTE');
      console.log(err);

      const unApprovedTransaction = container.resolve(
        UnApprovedTransactionVoteService,
      );

      await unApprovedTransaction.execute(vote.syncId, Array.from(err.message));
    }
  }
}

export default ReceivedVoteService;
