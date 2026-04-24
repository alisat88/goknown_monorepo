import ListAllRoomsDigitalassetsService from '@modules/organizations/services/ListAllRoomsDigitalassetsService';
import ListAllRoomsFoldersService from '@modules/organizations/services/ListAllRoomsFoldersService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class DigitalAssetsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const { room_id } = request.params;

    const listAllRoomsDigitalassetsService = container.resolve(
      ListAllRoomsDigitalassetsService,
    );

    const listAllRoomsDigitalassets =
      await listAllRoomsDigitalassetsService.execute(room_id);

    const listAllRoomsFolders = container.resolve(ListAllRoomsFoldersService);
    const folders = await listAllRoomsFolders.execute(room_id);

    return response.json({
      myassets: classToClass(listAllRoomsDigitalassets),
      publicassets: classToClass(listAllRoomsDigitalassets),
      folders: classToClass(folders),
    });
  }
}

export default DigitalAssetsController;
