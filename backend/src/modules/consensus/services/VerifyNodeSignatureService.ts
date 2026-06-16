import crypto from 'crypto';
import consensusConfig, {
  isKnownConsensusNode,
  validateConsensusConfig,
} from '@config/consensus';
import AppError from '@shared/errors/AppError';
import { injectable, container } from 'tsyringe';
import SignNodeMessageService from './SignNodeMessageService';

interface IRequest {
  nodeName?: string | string[];
  timestamp?: string | string[];
  signature?: string | string[];
  path: string;
  body: any;
}

@injectable()
class VerifyNodeSignatureService {
  public execute({
    nodeName,
    timestamp,
    signature,
    path,
    body,
  }: IRequest): string {
    validateConsensusConfig();

    const receivedNodeName = Array.isArray(nodeName) ? nodeName[0] : nodeName;
    const receivedTimestamp = Array.isArray(timestamp)
      ? timestamp[0]
      : timestamp;
    const receivedSignature = Array.isArray(signature)
      ? signature[0]
      : signature;

    if (!receivedNodeName || !receivedTimestamp || !receivedSignature) {
      throw new AppError('Missing consensus node signature.', 401);
    }

    if (!isKnownConsensusNode(receivedNodeName)) {
      throw new AppError('Unknown consensus node.', 403);
    }

    const parsedTimestamp = Number(receivedTimestamp);
    if (!Number.isFinite(parsedTimestamp)) {
      throw new AppError('Invalid consensus timestamp.', 401);
    }

    const messageAgeSeconds = Math.abs(Date.now() - parsedTimestamp) / 1000;
    if (messageAgeSeconds > consensusConfig.maxMessageAgeSeconds) {
      throw new AppError('Stale consensus message.', 401);
    }

    const signer = container.resolve(SignNodeMessageService);
    const expectedSignature = signer.execute({
      nodeName: receivedNodeName,
      timestamp: receivedTimestamp,
      path,
      body,
    });

    const received = Buffer.from(receivedSignature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      throw new AppError('Invalid consensus signature.', 401);
    }

    return receivedNodeName;
  }
}

export default VerifyNodeSignatureService;
