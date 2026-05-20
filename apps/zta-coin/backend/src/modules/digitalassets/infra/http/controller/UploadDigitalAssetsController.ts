import CreateDigitalAssetsService from '@modules/digitalassets/services/CreateDigitalAssetsService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { Response, Request } from 'express';
import { container } from 'tsyringe';

export default class UploadDigitalAssetsController {
  public async create(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_id = request.user.sync_id;

    const createDigitalAssets = container.resolve(CreateDigitalAssetsService);
    const digitalAsset = await createDigitalAssets.execute({
      filename: request.file.filename,
      name: request.body.name,
      description: request.body.description,
      folder_sync_id: request.body.folder_sync_id,
      privacy: request.body.privacy,
      sync_id: request.body.sync_id,
      master_node: request.body.masterNode,
      room_syncid: request.body.room_syncid,
      user_id,
    });

    // sync node
    // if (request.body.masterNode) {
    //   // mirror users across nodes
    //   nodes.map(node =>
    //     axios.post(
    //       `${node.url}/me/digitalassets/withoutfile`,
    //       {
    //         ...request.body,
    //         filename: digitalAsset.filename,
    //         mimetype: digitalAsset.mimetype,
    //         filetoken: digitalAsset.token,
    //       },
    //       {
    //         headers: {
    //           Authorization: request.headers.authorization,
    //           // pre_authenticated: request.headers.pre_authenticated,
    //         },
    //       },
    //     ),
    //   );
    // }
    // sync node
    if (request.body.masterNode) {
      const updatedRequest = {
        ...request,
        body: {
          ...request.body,
          ...request.body,
          filename: digitalAsset.filename,
          mimetype: digitalAsset.mimetype,
          filetoken: digitalAsset.token,
        },
      } as Request;

      // mirror users across nodes
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: request.body.sync_id,
        endpoint: '/me/digitalassets/withoutfile ',
        request: updatedRequest,
        method: 'post',
      });
    }

    return response.json(digitalAsset);
  }
}
