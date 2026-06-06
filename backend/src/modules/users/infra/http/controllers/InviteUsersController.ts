import nodes from '@config/nodes';
import CreateUserInvitationService from '@modules/users/services/CreateUserInvitationService';
import SendWelcomeInvitationEmailService from '@modules/users/services/SendWelcomeInvitationEmailService';
import ShowProfileService from '@modules/users/services/ShowProfileService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class InviteUsersController {
  public async create(request: Request, response: Response): Promise<Response> {
    try {
      const { sync_id: loggedUserSyncId } = request.user;
      // TODO - Dar opcao de enviar nome, role e charge, deixar charge dasativada por padrao
      const { email, sync_id = '', role, amount, name = '' } = request.body;

      const createUser = container.resolve(CreateUserInvitationService);
      const { user: inviteUser, setupToken } = await createUser.execute({
        email,
        sync_id,
        role,
        amount,
        name,
      });

      const showProfileService = container.resolve(ShowProfileService);
      const loggeduser = await showProfileService.execute({
        user_id: loggedUserSyncId,
      });

      if (!process.env.APP_WEB_URL) {
        return response.status(400).json({
          error: 'APP_WEB_URL is required to generate invitation setup links.',
        });
      }

      const setupLink = `${process.env.APP_WEB_URL.replace(
        /\/$/,
        '',
      )}/reset-password?token=${setupToken}`;

      if (request.body.masterNode) {
        // mirror users across nodes
        // nodes.map(node =>
        //   axios
        //     .post(`${node.url}/users/invite`, request.body, {
        //       headers: {
        //         Authorization: request.headers.authorization,
        //         // pre_authenticated: request.headers.pre_authenticated,
        //       },
        //     })
        //     .catch((err: AxiosError) =>
        //       console.log(err.response ? err.response.data : err.message),
        //     ),
        // );

        const syncNodeProvider = container.resolve(SyncNodeProvider);
        await syncNodeProvider.sync({
          // dapp_token_sync_id: sync_id,
          endpoint: `/users/invite`,
          request,
          method: 'post',
        });
        // mirror users across nodes
        // nodes.map(node =>
        //   axios.post(`${node.url}/users`, {
        //     ...request.body,
        //   }),
        // );
      }

      if (process.env.MAIL_BYPASS === 'true') {
        return response.json(
          classToClass({
            user: inviteUser,
            setup_link: setupLink,
          }),
        );
      }

      const sendWelcome = container.resolve(SendWelcomeInvitationEmailService);
      await sendWelcome.execute({
        email,
        name: inviteUser.name || email,
        setup_link: setupLink,
        invited_by: loggeduser.name,
      });

      return response.json(classToClass(inviteUser));
    } catch (err) {
      console.log(err);
      return response.status(400).json({ error: err.message });
    }
  }
}

export default InviteUsersController;
