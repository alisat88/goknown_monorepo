import { Router } from 'express';
import DAppBuilderController from '../controller/DAppBuilderController';

const dappBuilderRouter = Router();
const controller = new DAppBuilderController();

dappBuilderRouter.post('/generate', (req, res) => controller.generate(req, res));
dappBuilderRouter.post('/edit', (req, res) => controller.edit(req, res));

export default dappBuilderRouter;
