/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { container } from 'tsyringe';
import SlugProvider from './implementations/SlugProvider';
import ISlugProvider from './models/ISlugProvider';

container.registerSingleton<ISlugProvider>('SlugProvider', SlugProvider);
