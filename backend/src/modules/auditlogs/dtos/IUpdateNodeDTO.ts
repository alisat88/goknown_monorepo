export default interface IUpdateNodeDTO {
  dapp_token_sync_id: string;
  node: string;
  outcome: 'success' | 'error' | 'pending';
  message?: string;
  dapp?: string;
}
