import CreateFailedTransactionService from '@modules/transactions/services/CreateFailedTransactionService';
import CreateTransactionService from '@modules/transactions/services/CreateTransactionService';
import ListLatestTransactionsService from '@modules/transactions/services/ListLatestTransactionsService';
import SendVoteService from '@modules/votes/services/SendVoteService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';

import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class TransactionsController {
  // index : list all user transactions
  public async index(request: Request, response: Response): Promise<Response> {
    try {
      const { organizationId } = request.params;
      // get authenticated user id
      const user_id = request.user.sync_id;
      // init list latest user transactions
      const listLatestTransactions = container.resolve(
        ListLatestTransactionsService,
      );

      // exec search for latest user transactions
      const transactions = await listLatestTransactions.execute({
        user_id,
        organizationId,
      });
      return response.json(classToClass(transactions));
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  // create a new transaction
  public async create(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_id = request.user.sync_id;
    const { organizationId } = request.params;
    const {
      to_user_id,
      amount,
      message = '',
      sync_id,
      timestamp,
    } = request.body;

    try {
      // init the container for new transaction
      const createTransaction = container.resolve(CreateTransactionService);
      // exec transaction with the required params
      const transaction = await createTransaction.execute({
        amount,
        message,
        from_user_id: user_id,
        to_user_id,
        sync_id,
        organization_id: organizationId,
        timestamp,
      });

      // init container to save transaction on memory
      if (request.body.masterNode) {
        delete request.body.masterNode;

        const url = organizationId
          ? `/me/transactions/organizations/${organizationId}`
          : `/me/transactions`;

        const syncNodeProvider = container.resolve(SyncNodeProvider);
        await syncNodeProvider.sync({
          dapp_token_sync_id: sync_id,
          endpoint: url,
          request,
          method: 'post',
        });
        // // mirr

        // await Promise.all(
        // nodes.map(node => {
        //   const url = organizationId
        //     ? `${node.url}/me/transactions/organizations/${organizationId}`
        //     : `${node.url}/me/transactions`;
        //   return axios.post(url, request.body, {
        //     // security measure to make sure only authenticated users can init a new transaction
        //     headers: {
        //       Authorization: request.headers.authorization,
        //       // pre_authenticated: request.headers.pre_authenticated,
        //     },
        //   });
        //   // ),
        // });
      }

      await new Promise(resolve => {
        setTimeout(resolve, 500);
      });

      if (transaction.vote) {
        const sendVote = container.resolve(SendVoteService);

        // exec vote sending across nodes
        sendVote.execute({
          vote: transaction.vote,
          authorization: request.headers.authorization,
          // pre_authenticated: request.headers.pre_authenticated,
        });
      }

      return response.json(transaction);
    } catch (err: any) {
      // console.log('AQUIII =>', err);
      // case anything wrong with transaction, create a failed transaction
      const createFailedTransaction = container.resolve(
        CreateFailedTransactionService,
      );
      // create a failed transaction
      const failedTransaction = await createFailedTransaction.execute({
        amount,
        message,
        from_user_id: user_id,
        to_user_id,
        sync_id,
        timestamp,
        organization_id: organizationId,
        errorMessage: err.message,
      });
      console.log(failedTransaction);
      if (request.body.masterNode) {
        delete request.body.masterNode;
        // await Promise.all(
        //   nodes.map(
        //     node =>
        //       axios.post(`${node.url}/me/transactions`, request.body, {
        //         // security measure to make sure only authenticated users can init a new transaction
        //         headers: {
        //           Authorization: request.headers.authorization,
        //           // pre_authenticated: request.headers.pre_authenticated,
        //         },
        //       }),
        //     // ),
        //   );
        const syncNodeProvider = container.resolve(SyncNodeProvider);
        await syncNodeProvider.sync({
          dapp_token_sync_id: sync_id,
          endpoint: '/me/transactions',
          request,
          method: 'post',
        });
      }

      await new Promise(resolve => {
        setTimeout(resolve, 500);
      });
      // save vote on memory
      // send vote across nodes
      if (failedTransaction.vote) {
        const sendVote = container.resolve(SendVoteService);

        // execute the vote sending
        sendVote.execute({
          vote: {
            ...failedTransaction.vote,
            error: err.message,
          },
          authorization: request.headers.authorization,
          // pre_authenticated: request.headers.pre_authenticated,
        });
      }
      console.log('=====================', err.message, err);
      // throw new AppError(err.message);
      return response.status(400).json({ error: err.message });
    }
  }
}

export default TransactionsController;
