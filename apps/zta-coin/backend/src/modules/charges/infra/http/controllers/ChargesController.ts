import CreateChargeService from '@modules/charges/services/CreateChargeService';
import ListLatestChargesService from '@modules/charges/services/ListLatestChargesService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class ChargesController {
  public async index(request: Request, response: Response): Promise<Response> {
    try {
      const { organizationId } = request.params;
      const user_id = request.user.sync_id;
      const listLatestCharges = container.resolve(ListLatestChargesService);
      const lastetCharges = await listLatestCharges.execute({
        user_id,
        organization_id: organizationId,
      });

      return response.json(classToClass(lastetCharges));
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  public async create(request: Request, response: Response): Promise<Response> {
    try {
      const user_id = request.user.sync_id;
      const { organizationId } = request.params;

      const { amount, method, masterNode, sync_id } = request.body;

      const createCharge = container.resolve(CreateChargeService);
      const charge = await createCharge.execute({
        amount,
        user_id,
        method,
        sync_id,
        organization_id: organizationId,
      });

      if (masterNode) {
        const url = organizationId
          ? `/me/charges/organizations/${organizationId}`
          : `/me/charges`;

        const syncNodeProvider = container.resolve(SyncNodeProvider);
        await syncNodeProvider.sync({
          dapp_token_sync_id: sync_id,
          endpoint: url,
          request,
          method: 'post',
        });
      }

      return response.json(charge);
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }
}
