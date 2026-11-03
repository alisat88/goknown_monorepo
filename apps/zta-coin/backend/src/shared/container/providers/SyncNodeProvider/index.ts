/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { container } from 'tsyringe';
import SyncNodeProvider from './implementations/SyncNodeProvider';
import ISyncNodeProvider from './models/ISyncNodeProvider';

container.registerSingleton<ISyncNodeProvider>(
  'SyncNodeProvider',
  SyncNodeProvider,
);
