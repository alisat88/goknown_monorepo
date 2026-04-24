interface INodesConfig {
  name: string;
  url: string;
}

let nodes: INodesConfig[] = [];

// Try to read nodes from JSON in environment variable
if (process.env.NODES_JSON) {
  try {
    // Parse JSON from environment variable
    const parsedNodes = JSON.parse(process.env.NODES_JSON);
    if (Array.isArray(parsedNodes)) {
      nodes = parsedNodes;
      console.log('Nodes loaded from env:', nodes);
    }
  } catch (error) {
    console.error('Error on parse NODES_JSON:', error);
  }
} else {
  // Fallback for current node if there is no JSON
  nodes = [
    {
      name: process.env.NODE_NAME || 'NODE1',
      url: process.env.APP_API_URL || '',
    },
  ] as INodesConfig[];
  console.log('Using default node configuration:', nodes);
}

// filter to eliminate origin node
export default nodes.filter(value => value.name !== process.env.NODE_NAME);
