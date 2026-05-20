import AppError from '@shared/errors/AppError';

import nodes from '@config/nodes';
import IVoteDTO from '../infra/dtos/IVoteDTO';
import { api } from '@config/api';

interface IRequest {
  vote: IVoteDTO;
  authorization: string | undefined;
  pre_authenticated?: any;
}

// create vote sending service
class SendVoteService {
  // execute send with transaction info and user token authentication
  public async execute({
    vote,
    authorization,
    pre_authenticated,
  }: IRequest): Promise<void> {
    try {
      // execute the send of the transaction vote across nodes
      await Promise.all(
        nodes.map(
          async node =>
            await api.post(`${node.url}/votes`, vote, {
              // security measure to make sure only authenticated users can init a new transaction
              headers: {
                Authorization: authorization,
                // pre_authenticated: pre_authenticated,
              },
            }),

          // await axios({
          //   method: 'post',
          //   url: `${node.url}/votes`,
          //   data: vote,
          //   headers: {
          //     'Access-Control-Allow-Origin': true,
          //     // security measure to make sure only authenticated users can init a new transaction
          //     Authorization: authorization,
          //   },
          // }).catch(err => console.log(`ERROR ON SEND TO ${node.name}`, err)),
        ),
      );
    } catch (err: any) {
      console.log('MENSAGEM VINDO VOTE');
      console.log(err.message);
      // exception to create new error message
      throw new AppError(err.message);
    }
  }
}

export default SendVoteService;
