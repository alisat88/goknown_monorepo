/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { container } from 'tsyringe';

import IHashProvider from './HashProvider/models/IHashProvider';
import BCryptHashProvider from './HashProvider/implementations/BCryptHashProvider';

import IPinProvider from './PinProvider/models/IPinProvider';
import PinProvider from './PinProvider/implementations/PinProvider';

import './TwoFactorProvider';

container.registerSingleton<IHashProvider>('HashProvider', BCryptHashProvider);
container.registerSingleton<IPinProvider>('PinProvider', PinProvider);
