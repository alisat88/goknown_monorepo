export default interface IVoteDTO {
  type: 'transaction' | 'user' | 'charge';
  nodeName: string;
  syncId: string;
  toUserSyncId: string;
  fromUserSyncId: string;
  vote: 'approved' | 'unpproved' | 'failed';
  timestamp: number;
  error?: string;
}
