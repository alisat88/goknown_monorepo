import { Request, Response } from 'express';
import DAppBuilderAppsService from '@modules/dappbuilder/services/DAppBuilderAppsService';
import DAppBuilderRepository from '../../typeorm/repositories/DAppBuilderRepository';
import UsersRepository from '@modules/users/infra/typeorm/repositories/UsersRepository';

function makeService(): DAppBuilderAppsService {
  return new DAppBuilderAppsService(
    new DAppBuilderRepository(),
    new UsersRepository(),
  );
}

export default class DAppBuilderAppsController {
  // GET /dapp-builder/apps
  public async list(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    const apps = await svc.listForUser(req.user.sync_id);
    return res.json(apps);
  }

  // POST /dapp-builder/apps
  public async create(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    const app = await svc.createApp(req.user.sync_id, req.body);
    return res.status(201).json(app);
  }

  // GET /dapp-builder/apps/:id
  public async show(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    const app = await svc.getApp(req.params.id, req.user.sync_id);
    return res.json(app);
  }

  // PUT /dapp-builder/apps/:id
  public async update(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    const app = await svc.updateApp(req.params.id, req.user.sync_id, req.body);
    return res.json(app);
  }

  // DELETE /dapp-builder/apps/:id
  public async delete(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    await svc.deleteApp(req.params.id, req.user.sync_id);
    return res.status(204).send();
  }

  // POST /dapp-builder/apps/:id/share
  public async share(req: Request, res: Response): Promise<Response> {
    const { email, role } = req.body as { email?: string; role?: string };
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'email is required' });
    }
    const allowedRoles = ['Viewer', 'Builder', 'Reviewer'];
    const resolvedRole = allowedRoles.includes(role ?? '') ? role! : 'Viewer';

    const svc = makeService();
    const app = await svc.shareApp(
      req.params.id,
      req.user.sync_id,
      email,
      resolvedRole,
    );
    return res.json(app);
  }

  // DELETE /dapp-builder/apps/:id/share/:userId
  public async removeShare(req: Request, res: Response): Promise<Response> {
    const svc = makeService();
    const app = await svc.removeShare(
      req.params.id,
      req.user.sync_id,
      req.params.userId,
    );
    return res.json(app);
  }
}
