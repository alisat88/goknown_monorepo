import CreateDigitalAssetsService from '@modules/digitalassets/services/CreateDigitalAssetsService';

import FindDigitalAssetsService from '@modules/digitalassets/services/FindDigitalAssetsService';
import ListAllFoldersService from '@modules/digitalassets/services/ListAllFoldersService';
import ListAllPublicDigitalAssetsService from '@modules/digitalassets/services/ListAllPublicDigitalAssetsService';
import ListUserDigitalAssetsService from '@modules/digitalassets/services/ListUserDigitalAssetsService';
import UpdateUserDigitalAssetsService from '@modules/digitalassets/services/UpdateUserDigitalAssetsService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';

import { classToClass } from 'class-transformer';
import { Response, Request } from 'express';
import { container } from 'tsyringe';

export default class DigitalAssetsController {
  public async index(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    // find user assets
    const listUserDigitalAssets = container.resolve(
      ListUserDigitalAssetsService,
    );
    const myassets = await listUserDigitalAssets.execute(user_syncid);

    // find public assets
    const listAllPublicAssets = container.resolve(
      ListAllPublicDigitalAssetsService,
    );
    const publicassets = await listAllPublicAssets.execute(user_syncid);

    // find all folders
    const listAllFolders = container.resolve(ListAllFoldersService);
    const folders = await listAllFolders.execute(user_syncid);

    return response.json({
      myassets: classToClass(myassets),
      publicassets: classToClass(publicassets),
      folders: classToClass(folders),
    });
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const findDigitalAssets = container.resolve(FindDigitalAssetsService);
    const digitalassets = await findDigitalAssets.execute(id, user_syncid);

    return response.json(classToClass(digitalassets));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_id = request.user.sync_id;

    const createDigitalAssets = container.resolve(CreateDigitalAssetsService);
    const digitalAsset = await createDigitalAssets.execute({
      // filename: request.file.filename || request.body.filename,
      filename: request.body.filename,
      name: request.body.name,
      description: request.body.description,
      folder_sync_id: request.body.folder_sync_id,
      privacy: request.body.privacy,
      sync_id: request.body.sync_id,
      master_node: request.body.masterNode,
      mimeType: request.body.mimetype,
      filetoken: request.body.filetoken,
      room_syncid: request.body.room_syncid,
      user_id,
    });

    // sync node
    if (request.body.masterNode) {
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: digitalAsset.sync_id,
        endpoint: '/me/digitalassets',
        request,
        method: 'post',
      });
    }

    return response.json(digitalAsset);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { privacy, description, folder_sync_id } = request.body;
    const { id } = request.params;
    // authenticated user id lookup
    const user_id = request.user.sync_id;

    const updateUserDigitalAssets = container.resolve(
      UpdateUserDigitalAssetsService,
    );

    const digitalAsset = await updateUserDigitalAssets.execute({
      user_id,
      sync_id: id,
      description,
      privacy,
      folder_sync_id,
    });

    // sync node
    if (request.body.masterNode) {
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: id,
        endpoint: `/me/digitalassets/${id}`,
        request,
        method: 'put',
      });
    }

    return response.json(digitalAsset);
  }
}
