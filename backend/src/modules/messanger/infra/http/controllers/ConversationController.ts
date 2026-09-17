import { v4 } from 'uuid';
import CreateGroupConversationService from '@modules/messanger/services/CreateGroupConversationService';
import SocketServer from '@shared/infra/http/socketIO';
import GetUnreadService from '@modules/messanger/services/GetUnreadService';
import CreateNewConversationService from '@modules/messanger/services/CreateNewConversationService';
import FindConversationsService from '@modules/messanger/services/FindConversationsService';
import ListAllUserConversationsService from '@modules/messanger/services/ListAllUserConversationsService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class ConversationController {
  public async group(request: Request, response: Response): Promise<Response> {
    SocketServer.ensureAvailable();
    const conversation = await container
      .resolve(CreateGroupConversationService)
      .execute({
        creator: request.user.sync_id,
        name: request.body.name,
        emails: request.body.emails,
      });

    SocketServer.conversationsChanged(conversation.members);
    return response.status(201).json(conversation);
  }

  public async unread(request: Request, response: Response): Promise<Response> {
    return response.json(
      await container.resolve(GetUnreadService).execute(request.user.sync_id),
    );
  }

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
    SocketServer.ensureAvailable();
    const sender_id = request.user.sync_id;

    const { receiver_id } = request.body;

    const createNewConversation = container.resolve(
      CreateNewConversationService,
    );
    const conversation = await createNewConversation.execute({
      sender_id,
      receiver_id,
      sync_id: v4(),
    });

    SocketServer.conversationsChanged(conversation.members);
    return response.json(conversation);
  }
}
