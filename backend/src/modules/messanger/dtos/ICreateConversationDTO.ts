export default interface ICreateConversationDTO {
  members: string[];
  sync_id: string;
  type?: 'direct' | 'group';
  name?: string;
  created_by?: string;
  unread?: number[];
}
