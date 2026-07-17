import { Router } from 'express';
import DAppBuilderController from '../controller/DAppBuilderController';
import DAppBuilderAppsController from '../controller/DAppBuilderAppsController';
import {
  dappBuilderRateLimiter,
  validateGenerate,
  validateEdit,
} from '../middlewares/dappBuilderGuard';
import ensureDappBuilderAuth from '../middlewares/ensureDappBuilderAuth';

const dappBuilderRouter = Router();
const genController = new DAppBuilderController();
const appsController = new DAppBuilderAppsController();

// Rate limit applied to all /dapp-builder/* routes before reaching the controller.
dappBuilderRouter.use(dappBuilderRateLimiter);

// ── Generation (unauthenticated — API key is server-side) ─────────────────────
dappBuilderRouter.post('/generate', validateGenerate, (req, res) => genController.generate(req, res));
dappBuilderRouter.post('/edit',     validateEdit,     (req, res) => genController.edit(req, res));

// ── Persistence (authenticated — 401 for missing/invalid token, 403 for unauthorized) ──
dappBuilderRouter.get(    '/apps',              ensureDappBuilderAuth, (req, res) => appsController.list(req, res));
dappBuilderRouter.post(   '/apps',              ensureDappBuilderAuth, (req, res) => appsController.create(req, res));
dappBuilderRouter.get(    '/apps/:id',          ensureDappBuilderAuth, (req, res) => appsController.show(req, res));
dappBuilderRouter.put(    '/apps/:id',          ensureDappBuilderAuth, (req, res) => appsController.update(req, res));
dappBuilderRouter.delete( '/apps/:id',          ensureDappBuilderAuth, (req, res) => appsController.delete(req, res));
dappBuilderRouter.post(   '/apps/:id/share',    ensureDappBuilderAuth, (req, res) => appsController.share(req, res));
dappBuilderRouter.delete( '/apps/:id/share/:userId', ensureDappBuilderAuth, (req, res) => appsController.removeShare(req, res));

export default dappBuilderRouter;
