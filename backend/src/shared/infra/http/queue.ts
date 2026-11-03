/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import 'reflect-metadata';
import 'dotenv/config';

import '@shared/infra/typeorm';
// import '@shared/container';

// eslint-disable-next-line import/extensions
import Queue from './lib/Queue';

try {
  Queue.processQueue();
} catch (err) {
  console.log(err);
}
