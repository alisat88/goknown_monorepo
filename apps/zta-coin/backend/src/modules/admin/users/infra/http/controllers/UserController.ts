import UpdateUserService from '@modules/admin/users/services/UpdateUserService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class UserController {
  //   async index(request: Request, response: Response) {
  //     // TODO
  //   }

  //   async create(request: Request, response: Response) {
  //     // TODO
  //   }

  async update(request: Request, response: Response): Promise<Response> {
    const { name, role, status } = request.body;
    const { sync_id: logged_user_id } = request.user;
    const { sync_id: sync_user_id } = request.params;

    const updateUser = container.resolve(UpdateUserService);

    await updateUser.execute({
      sync_user_id,
      logged_user_id,
      name,
      // email,
      role,
      status,
    });
    if (request.body.masterNode) {
      const url = `/admin/users/${sync_user_id}`;
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        endpoint: url,
        request,
        method: 'put',
      });
    }
    return response.send();
  }

  //   async delete(request: Request, response: Response) {
  //     // TODO
  //   }
}

export default UserController;
