type Message = {
  id: string;
  conversation_syncid: string;
  sender: string;
  text: string;
  created_at: any;
  updated_at?: Date;
};

export default Message;
