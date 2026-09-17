import SocketServer from '@shared/infra/http/socketIO';
import IConversationsRepository from '@modules/messanger/repositories/IConversationsRepository';
import CreateNewMessageService from '@modules/messanger/services/CreateNewMessageService';
import ListAllUserMessagesService from '@modules/messanger/services/ListAllUserMessagesService';
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
    SocketServer.conversationsChanged([usersync_id]);
    return response.json(messages);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    SocketServer.ensureAvailable();
    const sender = request.user.sync_id;

    const { id } = request.params;

    const { text } = request.body;

    const createNewMessage = container.resolve(CreateNewMessageService);

    const message = await createNewMessage.execute({
      sender,
      conversation_syncid: id,
      text,
    });

    const conversations = container.resolve<IConversationsRepository>(
      'ConversationsRepository',
    );
    const conversation = await conversations.findBySyncId(id);
    if (conversation)
      SocketServer.messageCreated(message, conversation.members);

    return response.json(message);
  }
}
