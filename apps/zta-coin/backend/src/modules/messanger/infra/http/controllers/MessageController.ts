import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateNewMessageService from '@modules/messanger/services/CreateNewMessageService';
import ListAllUserMessagesService from '@modules/messanger/services/ListAllUserMessagesService';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class MessageController {
  public async index(request: Request, response: Response): Promise<Response> {
    const usersync_id = request.user.sync_id;

    const { id } = request.params;

    const listAllmessages = container.resolve(ListAllUserMessagesService);

    const messages = await listAllmessages.execute({
      usersync_id,
      conversation_syncid: id,
    });
    return response.json(messages);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const sender = request.user.sync_id;

    const { id } = request.params;

    const { text, masterNode } = request.body;

    const createNewMessage = container.resolve(CreateNewMessageService);

    const message = await createNewMessage.execute({
      sender,
      conversation_syncid: id,
      text,
    });

    if (masterNode) {
      // mirror users across nodes
      nodes.map(node => {
        const url = `${node.url}/conversations/${id}/messages`;

        return api
          .post(url, request.body, {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          })
          .catch((err: AxiosError) =>
            console.log(err.response ? err.response.data : err.message),
          );
      });
    }

    return response.json(message);
  }
}
