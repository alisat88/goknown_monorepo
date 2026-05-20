import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';
import LaboratoryController from '../controller/LaboratoryController';

const laboratoryRouter = Router();
const laboratoryController = new LaboratoryController();

laboratoryRouter.use(ensureAuthenticated);

laboratoryRouter.post('/', laboratoryController.create);

export default laboratoryRouter;
