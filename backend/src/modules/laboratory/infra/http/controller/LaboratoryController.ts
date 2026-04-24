import CreateTransactionLaboratoryService from '@modules/laboratory/services/CreateTransactionLaboratoryService';
import CreateUserLaboratoryService from '@modules/laboratory/services/CreateUserLaboratoryService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class LaboratoryController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { route, quantity = 1 } = request.body;
    const user_sync_id = request.user.sync_id;

    const createUser = container.resolve(CreateUserLaboratoryService);
    const createTransaction = container.resolve(
      CreateTransactionLaboratoryService,
    );

    switch (route) {
      case '/users':
        await createUser.execute({ quantity });
        break;
      case '/transactions':
        if (!request.headers.authorization) {
          return response
            .status(401)
            .json({ error: 'Authorization header not found' });
        }
        await createTransaction.execute({
          quantity,
          user_sync_id,
          authorization: request.headers.authorization,
        });
        break;
      default:
        break;
    }

    return response.send();
  }
}
