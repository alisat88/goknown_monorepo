import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateNewConversationService from '@modules/messanger/services/CreateNewConversationService';
import FindConversationsService from '@modules/messanger/services/FindConversationsService';
import ListAllUserConversationsService from '@modules/messanger/services/ListAllUserConversationsService';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class ConversationController {
  public async show(request: Request, response: Response): Promise<Response> {
    const usersync_id = request.user.sync_id;

    const { receiverId } = request.params;

    const findConversations = container.resolve(FindConversationsService);

    const conversation = await findConversations.execute({
      usersync_id,
      receiver_id: receiverId,
    });

    return response.json(conversation);
  }

  public async index(request: Request, response: Response): Promise<Response> {
    const usersync_id = request.user.sync_id;
    const { room_id } = request.query;
    const listAllUserConversations = container.resolve(
      ListAllUserConversationsService,
    );

    const conversations = await listAllUserConversations.execute({
      usersync_id,
      room_id: (room_id as string) || undefined,
    });

    return response.json(conversations);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const sender_id = request.user.sync_id;

    const { receiver_id, sync_id, masterNode } = request.body;

    const createNewConversation = container.resolve(
      CreateNewConversationService,
    );
    const conversation = await createNewConversation.execute({
      sender_id,
      receiver_id,
      sync_id,
    });

    if (masterNode) {
      // mirror users across nodes
      nodes.map(node => {
        const url = `${node.url}/conversations`;

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

    return response.json(conversation);
  }
}
