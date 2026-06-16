export default interface IConsensusPayloadDTO {
  proposalId: string;
  transactionSyncId: string;
  category: string;
  transactionType: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  organizationId?: string | null;
  originatingNode: string;
  createdAt: number;
}
