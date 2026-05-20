import DeleteAllMemoryVoteService from '@modules/votes/services/DeleteAllMemoryVoteService';
import ReceivedVoteService from '@modules/votes/services/ReceivedVoteService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class VotesController {
  public async create(request: Request, response: Response): Promise<Response> {
    try {
      // console.log(request.body);
      console.log(
        'RECEIVED ===>',
        request.body.nodeName,
        request.body.syncId,
        request.body.vote,
      );
      const receivedVote = container.resolve(ReceivedVoteService);
      await receivedVote.execute(request.body);

      return response.json({ ok: 'ok' });
    } catch (err) {
      console.log('ERROR =====>', err);
      // const unApprovedTransaction = container.resolve(
      //   UnApprovedTransactionVoteService,
      // );

      // // const failedMessages = new Set(
      // //   removeBlankValuesBecauseError.map(vote =>
      // //     vote.error ? vote.error.message : undefined,
      // //   ),
      // // );

      // const findTransaction = container.resolve(FindTransactionBySyncIdService);
      // const transaction = await findTransaction.execute(request.body.syncId);
      // if (transaction) {
      //   await unApprovedTransaction.execute(
      //     transaction,
      //     Array.from(request.body.error.message),
      //   );
      // }

      return response.status(400).json({ error: err.message });
    }
  }

  public async destroy(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const deleteAllMemoryVote = container.resolve(DeleteAllMemoryVoteService);
    await deleteAllMemoryVote.execute('transaction-vote');

    return response.send();
  }
}
