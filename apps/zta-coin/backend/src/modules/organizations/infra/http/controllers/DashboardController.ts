import DashboardRoomService from '@modules/organizations/services/DashboardRoomService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class DashboardController {
  public async show(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_id, group_id, room_id } = request.params;

    const dashboardRoom = container.resolve(DashboardRoomService);
    const room = await dashboardRoom.execute({
      user_syncid,
      room_syncid: room_id,
      group_syncid: group_id,
      organization_syncid: organization_id,
    });

    return response.json(classToClass(room));
  }
}

export default DashboardController;
