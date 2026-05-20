import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateFolderService from '@modules/digitalassets/services/CreateFolderService';
import DeleteFolderService from '@modules/digitalassets/services/DeleteFolderService';
import FindFolderService from '@modules/digitalassets/services/FindFolderService';
import ListAllFoldersService from '@modules/digitalassets/services/ListAllFoldersService';
import UpdateFolderService from '@modules/digitalassets/services/UpdateFolderService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class FoldersController {
  public async index(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const listAllFolders = container.resolve(ListAllFoldersService);
    const folders = await listAllFolders.execute(user_syncid);

    return response.json(classToClass(folders));
  }

  public async show(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const { id } = request.params;

    const findFolder = container.resolve(FindFolderService);
    const folder = await findFolder.execute(user_syncid, id);

    return response.json(classToClass(folder));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const {
      name,
      shared_users_ids,
      shared_groups_ids,
      sync_id,
      room_syncid,
      welcome = false,
      editable = true,
    } = request.body;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const createFolder = container.resolve(CreateFolderService);

    const folder = await createFolder.execute({
      name,
      user_syncid,
      shared_users_ids,
      shared_groups_ids,
      sync_id,
      room_syncid,
      editable,
      welcome,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: sync_id,
        endpoint: '/me/folders',
        request,
        method: 'post',
      });
    }

    return response.json({ myfolders: classToClass(folder) });
  }

  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const {
      name,
      shared_users_ids,
      shared_groups_ids,
      welcome = false,
    } = request.body;

    const { id } = request.params;

    const updateFolder = container.resolve(UpdateFolderService);
    const folder = await updateFolder.execute({
      name,
      user_syncid,
      welcome,
      shared_users_ids,
      shared_groups_ids,
      folder_syncid: id,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: id,
        endpoint: `/me/folders/${id}`,
        request,
        method: 'put',
      });
      // nodes.map(node =>
      //   axios.put(
      //     `${node.url}/me/folders/${id}`,
      //     { ...request.body },
      //     {
      //       headers: {
      //         Authorization: request.headers.authorization,
      //         // pre_authenticated: request.headers.pre_authenticated,
      //       },
      //     },
      //   ),
      // );
    }

    return response.json(classToClass(folder));
  }

  public async destroy(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id } = request.params;

    const deleteFolderService = container.resolve(DeleteFolderService);
    await deleteFolderService.execute(user_syncid, id);
    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.delete(`${node.url}/me/folders/${id}`, {
          params: { masterNode: true },
          headers: {
            Authorization: request.headers.authorization,
            // pre_authenticated: request.headers.pre_authenticated,
          },
        }),
      );
    }
    return response.send();
  }
}
