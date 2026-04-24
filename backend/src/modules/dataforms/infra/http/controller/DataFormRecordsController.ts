import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateDataFormRecordsService from '@modules/dataforms/services/CreateDataFormRecordsService';
import ListAllDataFormRecordsService from '@modules/dataforms/services/ListAllDataFormRecordsService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class DataFormRecordsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const listAllDataFormRecords = container.resolve(
      ListAllDataFormRecordsService,
    );

    const records = await listAllDataFormRecords.execute({
      form_syncid: id,
      user_syncid,
    });

    return response.json(classToClass(records));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { value_json, sync_id } = request.body;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const createDataFormRecord = container.resolve(
      CreateDataFormRecordsService,
    );
    const dataFormStructure = await createDataFormRecord.execute({
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
          `${node.url}/me/dataforms/${id}/records`,
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
