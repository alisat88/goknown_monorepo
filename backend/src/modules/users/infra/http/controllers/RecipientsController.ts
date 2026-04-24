import RecipientsUsersService from '@modules/users/services/RecipientsUsersService';
import ListUsersRecipientsService from '@modules/users/services/ListUsersRecipientsService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import nodes from '@config/nodes';
import { api } from '@config/api';

export default class recipientsController {
  public async index(request: Request, response: Response): Promise<Response> {
    try {
      const user_id = request.user.sync_id;

      const listUsersRecipients = container.resolve(ListUsersRecipientsService);
      const recipientsUsers = await listUsersRecipients.execute({ user_id });

      return response.json(recipientsUsers);
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  public async create(request: Request, response: Response): Promise<Response> {
    try {
      const user_id = request.user.sync_id;
      const { recipient_id } = request.body;

      const recipientUser = container.resolve(RecipientsUsersService);

      await recipientUser.execute({ user_id, recipient_id });

      if (request.body.masterNode) {
        // mirror users across nodes
        nodes.map(node =>
          api.post(`${node.url}/me/recipients`, request.body, {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          }),
        );
      }

      return response.status(204).send();
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  public async destroy(request: Request, response: Response): Promise<void> {
    const user_id = request.user.sync_id;
    const { recipient_id } = request.params;
  }
}
