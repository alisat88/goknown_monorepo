import { Router } from 'express';

import usersRouter from '@modules/admin/users/infra/http/routes/users.routes';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';

const adminRoutes = Router();

adminRoutes.use('/users', ensureAuthenticated, usersRouter);

export default adminRoutes;
