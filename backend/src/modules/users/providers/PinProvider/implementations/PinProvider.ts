/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IPinProvider from '../models/IPinProvider';
import * as securePin from 'secure-pin';

class PinProvider implements IPinProvider {
  public async generatePin(): Promise<string> {
    const pin = await securePin.generatePinSync(4);
    return pin;
  }
}

export default PinProvider;
