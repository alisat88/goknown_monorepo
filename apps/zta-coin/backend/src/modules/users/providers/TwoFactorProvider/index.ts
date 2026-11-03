/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { container } from 'tsyringe';
import twofactorConfig from '@config/twofactor';

import ITwoFactorProvider from './models/ITwoFactorProvider';
import TwoFactorProvider from './implementations/TwoFactorProvider';

import ISMSTwoFactorProvider from './models/ISMSTwoFactorProvider';
import SMSTwoFactorProvider from './implementations/SMSTwoFactorProvider';

container.registerSingleton<ITwoFactorProvider>(
  'TwoFactorProvider',
  TwoFactorProvider,
);

container.registerSingleton<ISMSTwoFactorProvider>(
  'SMSTwoFactorProvider',
  SMSTwoFactorProvider,
);
