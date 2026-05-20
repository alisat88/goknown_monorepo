import CreateTwoFactorService from '@modules/users/services/CreateTwoFactorService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import nodes from '@config/nodes';
import { api } from '@config/api';

export default class TwoFactorSessionCreateController {
  public async create(request: Request, response: Response): Promise<Response> {
    const sync_user_id = request.user.sync_id;

    const createTwoFactor = container.resolve(CreateTwoFactorService);

    const data = await createTwoFactor.execute(sync_user_id, response);

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/users/${sync_user_id}`,
            {
              sync_id: sync_user_id,
              twoFactorAuthenticationCode: data.key,
            },
            {
              headers: {
                Authorization: request.headers.authorization,
              },
            },
          )
          .catch(error => console.log(error)),
      );
    }

    return response.json(data);
  }
}
