import { api } from '@config/api';
import nodes from '@config/nodes';
import AddOrganizationUserService from '@modules/organizations/services/AddOrganizationUserService';
import SwitchOrganizationStatusUserService from '@modules/organizations/services/SwitchOrganizationStatusUserService';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

// status: EnumStatus.Active | EnumStatus.Inactive;

class OrganizationsUsersController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { user_syncid_add, role } = request.body;
    const { id } = request.params;

    const addOrganizationUser = container.resolve(AddOrganizationUserService);
    await addOrganizationUser.execute({
      sync_id: id,
      user_syncid,
      user_syncid_add,
      role,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .post(
            `${node.url}/organizations/${id}/add-user`,
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

    return response.status(200).send();
  }

  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { user_syncid_edited, status } = request.body;
    const { id } = request.params;

    const swtichOrganizationStatusUser = container.resolve(
      SwitchOrganizationStatusUserService,
    );

    await swtichOrganizationStatusUser.execute({
      status,
      sync_id: id,
      user_syncid_edited,
      user_syncid,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/organizations/${id}/switch-user`,
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

    return response.status(200).send();
  }
}

export default OrganizationsUsersController;
