import ListAllDLsService from '@modules/dls/services/ListAllDLsService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class DLsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listAllDLs = container.resolve(ListAllDLsService);
    const dls = await listAllDLs.execute();

    return response.json(dls);
  }
}

export default DLsController;
