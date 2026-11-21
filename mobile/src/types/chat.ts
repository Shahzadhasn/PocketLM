export type MessageRole = "user" | "assistant";

export type ChatMessage = {
  id: number;
  role: MessageRole;
  content: string;
};

export type ChatHistoryMessage = Pick<ChatMessage, "role" | "content">;

export type Conversation = {
  id: number;
  title: string;
  created_at: number;
  updated_at: number;
};
