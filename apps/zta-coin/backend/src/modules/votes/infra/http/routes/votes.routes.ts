import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';
import VotesController from '../controllers/VotesController';

const votesRouter = Router();

const votesController = new VotesController();

votesRouter.use(ensureAuthenticated);

votesRouter.post('/', votesController.create);

votesRouter.delete('/', votesController.destroy);

export default votesRouter;
