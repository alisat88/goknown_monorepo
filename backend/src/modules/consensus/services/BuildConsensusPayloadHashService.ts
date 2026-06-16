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
