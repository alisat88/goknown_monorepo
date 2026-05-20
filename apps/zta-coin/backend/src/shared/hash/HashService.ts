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