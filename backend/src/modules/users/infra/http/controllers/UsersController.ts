import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateFolderService from '@modules/digitalassets/services/CreateFolderService';
import AuthenticateUserService from '@modules/users/services/AuthenticateUserService';
import CreateUserService from '@modules/users/services/CreateUserService';
import ListAllUsersService from '@modules/users/services/ListAllUsersService';
import SendWelcomeEmailService from '@modules/users/services/SendWelcomeEmailService';
import UpdateUserService from '@modules/users/services/UpdateUserService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class UsersController {
  public async index(request: Request, response: Response): Promise<Response> {
    try {
      const { status = '', name = '', limit = 30, offset = 0 } = request.query;
      const listAllUsers = container.resolve(ListAllUsersService);

      const users = await listAllUsers.execute({
        status: String(status),
        name: String(name),
        limit: Number(limit),
        offset: Number(offset),
      });
      return response.json(users);
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  public async create(request: Request, response: Response): Promise<Response> {
    try {
      const {
        name,
        email,
        password,
        sync_id = '',
        pin,
        ignoreWelcomeEmail = false,
      } = request.body;

      const createUser = container.resolve(CreateUserService);
      const user = await createUser.execute({
        name,
        email,
        password,
        sync_id,
        pin,
      });

      const folderBody = {
        name: 'My Personal Folder',
        sync_id: user.sync_id,
        editable: false,
      };
      const createFolder = container.resolve(CreateFolderService);

      await createFolder.execute({ ...folderBody, user_syncid: user.sync_id });

      // const chargeBody = {
      //   amount: 0,
      //   method: EnumMethod.Fake,
      //   sync_id,
      // };
      // const createCharge = container.resolve(CreateChargeService);
      // await createCharge.execute({ ...chargeBody, user_id: user.sync_id });

      // auth user
      const authenticateUser = container.resolve(AuthenticateUserService);

      const { _, token } = await authenticateUser.execute({
        email: email.toLowerCase(),
        password: password,
      });

      if (request.body.masterNode) {
        // mirror users across nodes
        await Promise.all(
          nodes.map(node =>
            api.post(`${node.url}/users`, { ...request.body, pin: user.pin }),
          ),
        );

        // mirror users across nodes
        const syncNodeProvider = container.resolve(SyncNodeProvider);

        await syncNodeProvider.sync({
          dapp_token_sync_id: sync_id,
          endpoint: '/me/folders',
          request: {
            ...request,
            body: folderBody,
            headers: { ...request.headers, authorization: `Bearer ${token}` },
          } as Request,
          dapp: 'Folder',
          method: 'post',
        });

        // mirror users across nodes
        // await syncNodeProvider.sync({
        //   dapp_token_sync_id: sync_id,
        //   endpoint: `/me/charges`,
        //   request: {
        //     ...request,
        //     body: chargeBody,
        //     headers: { ...request.headers, authorization: `Bearer ${token}` },
        //   } as Request,
        //   dapp: 'Charge',
        //   method: 'post',
        // });

        // send email
        if (!ignoreWelcomeEmail) {
          const sendWelcome = container.resolve(SendWelcomeEmailService);
          await sendWelcome.execute({ email, name, pin: user.pin });
        }
      }

      return response.json(classToClass(user));
    } catch (err) {
      console.log(err);
      return response.status(400).json({ error: err.message });
    }
  }

  public async update(request: Request, response: Response): Promise<Response> {
    try {
      const { twoFactorAuthenticationCode, phone } = request.body;
      const { sync_id } = request.user;

      const updateUser = container.resolve(UpdateUserService);
      await updateUser.execute({
        sync_user_id: sync_id,
        phone,
        twoFactorAuthenticationCode,
      });

      return response.send();
    } catch (error) {
      console.log(error);
      return response.status(400).json({ error: error.message });
    }
  }
}
