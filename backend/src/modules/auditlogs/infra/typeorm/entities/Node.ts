type Node = {
  node: string;
  outcome: 'success' | 'error' | 'pending';
  message?: any;
  created_at?: string;
};

export default Node;
