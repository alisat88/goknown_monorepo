export interface IMessageItem {
  id?: string;
  _id?: string;
  text: string;
  sender: string;
  conversation_id?: string;
  conversation_syncid?: string;
  created_at: string;
}
export interface IConversationItem {
  id: string;
  sync_id: string;
  type?: "direct" | "group";
  name?: string | null;
  members: string[];
  participants?: { sync_id: string; name: string; avatar_url?: string }[];
  created_at: string;
}
export interface IChatItem {
  id: string;
  sync_id: string;
  avatar_url?: string;
  name: string;
  news?: number;
  conversation?: IConversationItem;
  messages?: IMessageItem[];
}
export function messageBelongsToConversation(
  message: IMessageItem,
  conversationId?: string
) {
  return (
    !!conversationId &&
    (message.conversation_id || message.conversation_syncid) === conversationId
  );
}
