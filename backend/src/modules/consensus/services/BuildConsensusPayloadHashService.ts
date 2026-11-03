/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import crypto from 'crypto';
import { injectable } from 'tsyringe';

@injectable()
class BuildConsensusPayloadHashService {
  public deterministicStringify(value: any): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map(item => this.deterministicStringify(item)).join(',')}]`;
    }

    return `{${Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(
        key =>
          `${JSON.stringify(key)}:${this.deterministicStringify(value[key])}`,
      )
      .join(',')}}`;
  }

  public execute(payload: any): string {
    return crypto
      .createHash('sha256')
      .update(this.deterministicStringify(payload))
      .digest('hex');
  }
}

export default BuildConsensusPayloadHashService;
