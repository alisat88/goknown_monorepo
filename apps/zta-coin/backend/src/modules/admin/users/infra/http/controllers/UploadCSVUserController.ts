import UploadCSVUserService from '@modules/admin/users/services/UploadCSVUserService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Response, Request } from 'express';
import { container } from 'tsyringe';

class UploadCSVUserController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_sync_id = request.user.sync_id;

    const uploadCSVUser = container.resolve(UploadCSVUserService);

    const registerdUsers = await uploadCSVUser.execute({
      filename: request.file.filename,
      user_sync_id,
      masterNode: request.body.masterNode as boolean,
    });

    // sync node
    // if (request.body.masterNode) {
    //   const syncNodeProvider = container.resolve(SyncNodeProvider);
    //   await syncNodeProvider.sync({
    //     // dapp_token_sync_id: digitalAsset.sync_id,
    //     endpoint: '/upload',
    //     request,
    //     method: 'post',
    //   });
    // }
    return response.json(registerdUsers);
  }
}

export default UploadCSVUserController;
