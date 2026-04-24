import CreateDataFormsService from '@modules/dataforms/services/CreateDataFormsService';
import FindDataFormsService from '@modules/dataforms/services/FindDataFormsService';
import ListAllDataFormsService from '@modules/dataforms/services/ListAllDataFormsService';
import UpdateDataFormService from '@modules/dataforms/services/UpdateDataFormService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class DataFormsController {
  public async index(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const listAllDataForms = container.resolve(ListAllDataFormsService);
    const dataForms = await listAllDataForms.execute(user_syncid);

    return response.json(classToClass(dataForms));
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const findDataForm = container.resolve(FindDataFormsService);
    const dataForm = await findDataForm.execute({ sync_id: id, user_syncid });
    return response.json(classToClass(dataForm));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const {
      name,
      description,
      privacy,
      shared_groups_ids,
      sync_id,
      room_syncid,
    } = request.body;

    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const createDataForm = container.resolve(CreateDataFormsService);
    const dataForm = await createDataForm.execute({
      name,
      description,
      privacy,
      shared_groups_ids,
      sync_id,
      room_syncid,
      user_syncid,
    });

    // sync node
    if (request.body.masterNode) {
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: request.body.sync_id,
        endpoint: '/me/dataforms ',
        request,
        method: 'post',
      });
    }

    return response.json({ myDataForms: classToClass(dataForm) });
  }

  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { name, description, shared_groups_ids, privacy } = request.body;

    const { id } = request.params;

    const updateDataForm = container.resolve(UpdateDataFormService);
    const folder = await updateDataForm.execute({
      name,
      user_syncid,
      description,
      shared_groups_ids,
      dataform_syncid: id,
      privacy,
    });

    // sync node
    if (request.body.masterNode) {
      const syncNodeProvider = container.resolve(SyncNodeProvider);
      await syncNodeProvider.sync({
        dapp_token_sync_id: id,
        endpoint: `/me/dataforms/${id}`,
        request,
        method: 'put',
      });
    }

    return response.json(classToClass(folder));
  }
}
