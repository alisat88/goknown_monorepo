import FindGroupService from '@modules/organizations/services/FindGroupService';
import CreateGroupService from '@modules/organizations/services/CreateGroupService';
import ListAllGroupsService from '@modules/organizations/services/ListAllGroupsService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import UpdateGroupService from '@modules/organizations/services/UpdateGroupService';
import nodes from '@config/nodes';
import { AxiosError } from 'axios';
import { api } from '@config/api';

export default class GroupController {
  public async show(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id } = request.params;

    const findGroup = container.resolve(FindGroupService);

    const group = await findGroup.execute({
      group_syncid: group_id,
      user_syncid,
      organization_syncid: organization_id,
    });

    return response.json(classToClass(group));
  }

  public async index(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id } = request.params;

    const listAllGroups = container.resolve(ListAllGroupsService);
    const groups = await listAllGroups.execute({
      user_syncid,
      organization_syncid: organization_id,
    });

    return response.json(classToClass(groups));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id } = request.params;

    const { name, admin_id, sync_id } = request.body;

    const createGroup = container.resolve(CreateGroupService);
    const group = await createGroup.execute({
      name,
      admin_id,
      organization_id,
      user_syncid,
      sync_id,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .post(
            `${node.url}/organizations/${organization_id}/groups`,
            { ...request.body },
            {
              headers: {
                Authorization: request.headers.authorization,
                // pre_authenticated: request.headers.pre_authenticated,
              },
            },
          )
          .catch((err: AxiosError) =>
            console.log(err.response ? err.response.data : err.message),
          ),
      );
    }

    return response.json(group);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id } = request.params;
    const { name, admin_id } = request.body;

    const updateGroup = container.resolve(UpdateGroupService);
    const group = await updateGroup.execute({
      admin_syncid: admin_id,
      name,
      group_syncid: group_id,
      user_syncid,
      organization_syncid: organization_id,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/organizations/${organization_id}/groups/${group_id}`,
            { ...request.body },
            {
              headers: {
                Authorization: request.headers.authorization,
                // pre_authenticated: request.headers.pre_authenticated,
              },
            },
          )
          .catch((err: AxiosError) =>
            console.log(err.response ? err.response.data : err.message),
          ),
      );
    }

    return response.json(group);
  }
}
