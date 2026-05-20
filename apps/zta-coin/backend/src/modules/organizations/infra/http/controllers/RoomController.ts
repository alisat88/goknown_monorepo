import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { classToClass } from 'class-transformer';
import CreateRoomService from '@modules/organizations/services/CreateRoomService';
import ListAllRoomsService from '@modules/organizations/services/ListAllRoomsService';
import FindRoomService from '@modules/organizations/services/FindRoomService';
import UpdateRoomService from '@modules/organizations/services/UpdateRoomService';
import nodes from '@config/nodes';
import { AxiosError } from 'axios';
import { api } from '@config/api';

export default class RoomController {
  public async show(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id, room_id } = request.params;

    const findRoom = container.resolve(FindRoomService);
    const room = await findRoom.execute({
      user_syncid,
      room_syncid: room_id,
      group_syncid: group_id,
      organization_syncid: organization_id,
    });

    return response.json(classToClass(room));
  }

  public async index(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id } = request.params;

    const listAllRooms = container.resolve(ListAllRoomsService);
    const rooms = await listAllRooms.execute({
      user_syncid,
      group_syncid: group_id,
      organization_syncid: organization_id,
    });

    return response.json(classToClass(rooms));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id } = request.params;
    const { name, dls_syncids, sync_id } = request.body;

    const createRoom = container.resolve(CreateRoomService);
    const room = await createRoom.execute({
      group_syncid: group_id,
      name,
      user_syncid,
      dls_syncids,
      sync_id,
      organization_syncid: organization_id,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .post(
            `${node.url}/organizations/${organization_id}/groups/${group_id}/rooms`,
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

    return response.json(room);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id, room_id } = request.params;
    const { name, dls_syncids } = request.body;

    const updateRoom = container.resolve(UpdateRoomService);
    const room = await updateRoom.execute({
      user_syncid,
      organization_syncid: organization_id,
      group_syncid: group_id,
      name,
      dls_syncids,
      room_syncid: room_id,
    });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/organizations/${organization_id}/groups/${group_id}/rooms/${room_id}`,
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

    return response.json(classToClass(room));
  }
}
