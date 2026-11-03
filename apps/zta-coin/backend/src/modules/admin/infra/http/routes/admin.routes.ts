/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Router } from 'express';

import usersRouter from '@modules/admin/users/infra/http/routes/users.routes';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';

const adminRoutes = Router();

adminRoutes.use('/users', ensureAuthenticated, usersRouter);

export default adminRoutes;
