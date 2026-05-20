import IssueTokenUserService from '@modules/admin/users/services/IssueTokenUserService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class IssueTokenController {
  async create(request: Request, response: Response): Promise<Response> {
    const { sync_id: sync_user_id } = request.params;
    const { amount, password, masterNode } = request.body;
    const { sync_id } = request.user;

    const issueTokenUserService = container.resolve(IssueTokenUserService);

    await issueTokenUserService.execute({
      amount,
      password,
      sync_user_id,
      logged_user_sync_id: sync_id,
    });

    if (masterNode) {
      const url = `/admin/users/${sync_user_id}/issue-tokens`;

      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: sync_user_id,
        endpoint: url,
        request,
        method: 'post',
      });
    }

    return response.send();
  }
}

export default IssueTokenController;
