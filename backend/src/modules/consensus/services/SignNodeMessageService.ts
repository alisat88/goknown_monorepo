import crypto from 'crypto';
import consensusConfig from '@config/consensus';
import { injectable, container } from 'tsyringe';
import BuildConsensusPayloadHashService from './BuildConsensusPayloadHashService';

interface IRequest {
  nodeName?: string;
  timestamp?: string;
  path: string;
  body: any;
}

@injectable()
class SignNodeMessageService {
  public buildBodyHash(body: any): string {
    const buildHash = container.resolve(BuildConsensusPayloadHashService);
    return buildHash.execute(body || {});
  }

  public execute({ nodeName, timestamp, path, body }: IRequest): string {
    const signatureNodeName = nodeName || consensusConfig.localNodeName;
    const signatureTimestamp = timestamp || Date.now().toString();
    const bodyHash = this.buildBodyHash(body);
    const signedPayload = [
      signatureNodeName,
      signatureTimestamp,
      path,
      bodyHash,
    ].join('.');

    return crypto
      .createHmac('sha256', consensusConfig.sharedSecret)
      .update(signedPayload)
      .digest('hex');
  }

  public buildHeaders(path: string, body: any): Record<string, string> {
    const timestamp = Date.now().toString();

    return {
      'x-bft-node-name': consensusConfig.localNodeName,
      'x-bft-timestamp': timestamp,
      'x-bft-signature': this.execute({
        nodeName: consensusConfig.localNodeName,
        timestamp,
        path,
        body,
      }),
    };
  }
}

export default SignNodeMessageService;
