import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateDataFormStructuresService from '@modules/dataforms/services/CreateDataFormStructuresService';
import FindDataFromStructuresService from '@modules/dataforms/services/FindDataFromStructuresService';
import UpdateDataFormStructuresService from '@modules/dataforms/services/UpdateDataFormStructuresService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class DataFormStructuresController {
  public async index(request: Request, response: Response): Promise<Response> {
    return response.send();
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const findDataFormStructures = container.resolve(
      FindDataFromStructuresService,
    );

    const dataFormStructure = await findDataFormStructures.execute({
      user_syncid,
      form_syncid: id,
    });

    return response.json(classToClass(dataFormStructure));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { value_json, sync_id } = request.body;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const createDataForm = container.resolve(CreateDataFormStructuresService);
    const dataFormStructure = await createDataForm.execute({
      value_json,
      user_syncid,
      sync_id,
      form_syncid: id,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.post(
          `${node.url}/me/dataforms/${id}/structures`,
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

    return response.json(classToClass(dataFormStructure));
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { value_json } = request.body;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const updateDataFormStructures = container.resolve(
      UpdateDataFormStructuresService,
    );
    const dataFormStructure = await updateDataFormStructures.execute({
      value_json,
      user_syncid,
      form_syncid: id,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.put(
          `${node.url}/me/dataforms/${id}/structures`,
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

    return response.json(classToClass(dataFormStructure));
  }
}
