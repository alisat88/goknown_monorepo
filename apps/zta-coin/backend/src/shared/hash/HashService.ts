/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { createHash } from 'crypto';

class HashService {
  // 🔐 Canonical stringify (sorted keys)
  private canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return `[${obj.map(item => this.canonicalize(item)).join(',')}]`;
    }

    const keys = Object.keys(obj).sort();

    return `{${keys
      .map(key => `"${key}":${this.canonicalize(obj[key])}`)
      .join(',')}}`;
  }

  // 🔑 Generate SHA256 hash
  public hash(data: any): string {
    const canonical = this.canonicalize(data);

    return createHash('sha256')
      .update(canonical)
      .digest('hex');
  }
}

export const hashService = new HashService();