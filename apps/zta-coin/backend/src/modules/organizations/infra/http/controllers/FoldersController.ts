import ListAllRoomsFoldersService from '@modules/organizations/services/ListAllRoomsFoldersService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class FoldersController {
  public async index(request: Request, response: Response): Promise<Response> {
    const { room_id } = request.params;

    const listAllRoomsFolders = container.resolve(ListAllRoomsFoldersService);
    const dataforms = await listAllRoomsFolders.execute(room_id);
    return response.json(dataforms);
  }
}

export default FoldersController;
