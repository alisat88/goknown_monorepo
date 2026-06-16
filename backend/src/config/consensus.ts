interface IConsensusNode {
  name: string;
  url: string;
}

interface IConsensusConfig {
  enabled: boolean;
  localNodeName: string;
  localNodeUrl: string;
  clusterNodes: IConsensusNode[];
  sharedSecret: string;
  quorumSize: number;
  requestTimeoutMs: number;
  maxMessageAgeSeconds: number;
}

function parseBoolean(value?: string): boolean {
  return value === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseClusterNodes(value?: string): IConsensusNode[] {
  return (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const separatorIndex = item.indexOf(':');
      if (separatorIndex < 1) {
        return null;
      }

      const name = item.slice(0, separatorIndex).trim();
      const url = item.slice(separatorIndex + 1).trim().replace(/\/$/, '');

      if (!name || !url || !/^https?:\/\//i.test(url)) {
        return null;
      }

      return { name, url };
    })
    .filter((node): node is IConsensusNode => !!node);
}

const enabled = parseBoolean(process.env.BFT_CONSENSUS_ENABLED);
const clusterNodes = parseClusterNodes(process.env.BFT_CLUSTER_NODES);
const quorumSize = parseNumber(process.env.BFT_QUORUM_SIZE, 2);

const consensusConfig: IConsensusConfig = {
  enabled,
  localNodeName: process.env.BFT_NODE_NAME || process.env.NODE_NAME || '',
  localNodeUrl: (process.env.BFT_NODE_URL || process.env.APP_API_URL || '').replace(
    /\/$/,
    '',
  ),
  clusterNodes,
  sharedSecret: process.env.BFT_NODE_SHARED_SECRET || '',
  quorumSize,
  requestTimeoutMs: parseNumber(process.env.BFT_REQUEST_TIMEOUT_MS, 5000),
  maxMessageAgeSeconds: parseNumber(
    process.env.BFT_MAX_MESSAGE_AGE_SECONDS,
    300,
  ),
};

export function validateConsensusConfig(): void {
  if (!consensusConfig.enabled) {
    return;
  }

  const nodeNames = new Set(consensusConfig.clusterNodes.map(node => node.name));

  if (!consensusConfig.localNodeName) {
    throw new Error('BFT_NODE_NAME is required when consensus is enabled.');
  }

  if (!consensusConfig.sharedSecret) {
    throw new Error(
      'BFT_NODE_SHARED_SECRET is required when consensus is enabled.',
    );
  }

  if (consensusConfig.clusterNodes.length < 3) {
    throw new Error(
      'BFT_CLUSTER_NODES must include at least three valid nodes when consensus is enabled.',
    );
  }

  if (!nodeNames.has(consensusConfig.localNodeName)) {
    throw new Error(
      'BFT_NODE_NAME must match one entry in BFT_CLUSTER_NODES when consensus is enabled.',
    );
  }

  if (consensusConfig.quorumSize < 2) {
    throw new Error('BFT_QUORUM_SIZE must be at least 2.');
  }

  if (consensusConfig.quorumSize > consensusConfig.clusterNodes.length) {
    throw new Error('BFT_QUORUM_SIZE cannot exceed configured cluster size.');
  }
}

export function getPeerConsensusNodes(): IConsensusNode[] {
  return consensusConfig.clusterNodes.filter(
    node => node.name !== consensusConfig.localNodeName,
  );
}

export function isKnownConsensusNode(nodeName: string): boolean {
  return consensusConfig.clusterNodes.some(node => node.name === nodeName);
}

export default consensusConfig;
