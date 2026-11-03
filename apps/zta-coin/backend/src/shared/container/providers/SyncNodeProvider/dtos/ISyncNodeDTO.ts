/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Request } from 'express';

export type ISyncNodeDTO = {
  endpoint: string;
  request: Request;
  method: 'post' | 'put';
  dapp_token_sync_id?: string;
  forceRequestBody?: any;
  dapp?: string;
};
