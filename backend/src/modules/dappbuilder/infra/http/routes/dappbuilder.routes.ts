import { Router } from 'express';
import DAppBuilderController from '../controller/DAppBuilderController';
import {
  dappBuilderRateLimiter,
  validateGenerate,
  validateEdit,
} from '../middlewares/dappBuilderGuard';

const dappBuilderRouter = Router();
const controller = new DAppBuilderController();

// Rate limit applied to all /dapp-builder/* routes before reaching the controller.
dappBuilderRouter.use(dappBuilderRateLimiter);

dappBuilderRouter.post('/generate', validateGenerate, (req, res) => controller.generate(req, res));
dappBuilderRouter.post('/edit',     validateEdit,     (req, res) => controller.edit(req, res));

export default dappBuilderRouter;
