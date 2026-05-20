import { api } from '@config/api';
import nodes from '@config/nodes';
import AddRoomUserService from '@modules/organizations/services/AddRoomUserService';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class OrganizationsUsersRoomsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id, room_id } = request.params;
    const { user_syncid_add } = request.body;

    const addRoomuser = container.resolve(AddRoomUserService);
    await addRoomuser.execute({
      group_syncid: group_id,
      room_syncid: room_id,
      user_syncid,
      user_syncid_add,
    });

    // '/:id/groups/:group_id/rooms/:room_id/add-user',

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .post(
            `${node.url}/organizations/${organization_id}/groups/${group_id}/rooms/${room_id}/add-user`,
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

export default OrganizationsUsersRoomsController;
