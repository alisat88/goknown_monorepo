export default interface ICreateAuditLogDTO {
  user_id: string;
  sync_id?: string;
  action: string;
  dapp: string;
  dapp_token: string;
  dapp_token_sync_id: string;
  outcome: string;
  leader_node: string;
  message?: any;
}
