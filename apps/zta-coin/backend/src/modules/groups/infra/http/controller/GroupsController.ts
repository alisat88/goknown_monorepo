import CreateGroupService from '../../../services/CreateGroupService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import FindGroupService from '@modules/groups/services/FindGroupService';
import UpdateGroupService from '@modules/groups/services/UpdateGroupService';
import ListAllGroupsService from '@modules/groups/services/ListAllGroupsService';
import nodes from '@config/nodes';
import DeleteGroupService from '@modules/groups/services/DeleteGroupService';
import { api } from '@config/api';

export default class GroupsController {
  public async index(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { name = '' } = request.query;

    const listAllGroups = container.resolve(ListAllGroupsService);
    const organization = await listAllGroups.execute(user_syncid, String(name));

    return response.json(classToClass(organization));
  }

  public async show(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const { id } = request.params;

    const findGroup = container.resolve(FindGroupService);
    const group = await findGroup.execute(user_syncid, id);

    return response.json(classToClass(group));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, shared_users_ids, sync_id, description } = request.body;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const createGroup = container.resolve(CreateGroupService);
    // TODO: remind to send sync_id when sync all nodes
    const group = await createGroup.execute({
      name: name,
      user_syncid,
      shared_users_ids,
      sync_id,
      description,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.post(
          `${node.url}/me/groups`,
          { ...request.body },
          {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          },
        ),
      );
    }

    return response.json(classToClass(group));
  }

  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { name, description, shared_users_ids } = request.body;

    const { id } = request.params;

    const updateGroupService = container.resolve(UpdateGroupService);
    const folder = await updateGroupService.execute({
      name,
      user_syncid,
      shared_users_ids,
      group_syncid: id,
      description,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.put(
          `${node.url}/me/groups/${id}`,
          { ...request.body },
          {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          },
        ),
      );
    }

    return response.json(classToClass(folder));
  }

  public async destroy(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id } = request.params;

    const deleteGroupService = container.resolve(DeleteGroupService);
    await deleteGroupService.execute(user_syncid, id);
    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.delete(`${node.url}/me/groups/${id}`, {
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
