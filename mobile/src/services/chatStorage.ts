import * as SQLite from "expo-sqlite";
import type { ChatMessage, Conversation, MessageRole } from "../types/chat";

const database = SQLite.openDatabaseAsync("rag-agent.db");

export async function initializeChatStorage(): Promise<void> {
  const db = await database;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(messages)"
  );
  if (!columns.some((column) => column.name === "conversation_id")) {
    await db.execAsync("ALTER TABLE messages ADD COLUMN conversation_id INTEGER");
  }
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id)"
  );

  const orphaned = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM messages WHERE conversation_id IS NULL"
  );
  if ((orphaned?.count ?? 0) > 0) {
    const now = Date.now();
    const firstUserMessage = await db.getFirstAsync<{ content: string }>(
      "SELECT content FROM messages WHERE conversation_id IS NULL AND role = 'user' ORDER BY id LIMIT 1"
    );
    const timestamps = await db.getFirstAsync<{
      created_at: number;
      updated_at: number;
    }>(
      "SELECT MIN(created_at) AS created_at, MAX(created_at) AS updated_at FROM messages WHERE conversation_id IS NULL"
    );
    const title = firstUserMessage?.content.trim().slice(0, 48) || "Previous chat";
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        "INSERT INTO conversations (title, created_at, updated_at) VALUES (?, ?, ?)",
        title,
        timestamps?.created_at ?? now,
        timestamps?.updated_at ?? now
      );
      await db.runAsync(
        "UPDATE messages SET conversation_id = ? WHERE conversation_id IS NULL",
        result.lastInsertRowId
      );
    });
  }

  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM conversations"
  );
  if ((count?.count ?? 0) === 0) {
    await createConversation();
  }
}

export async function listConversations(): Promise<Conversation[]> {
  const db = await database;
  return db.getAllAsync<Conversation>(
    "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC, id DESC"
  );
}

export async function createConversation(): Promise<Conversation> {
  const db = await database;
  const now = Date.now();
  const result = await db.runAsync(
    "INSERT INTO conversations (title, created_at, updated_at) VALUES (?, ?, ?)",
    "New chat",
    now,
    now
  );
  return {
    id: result.lastInsertRowId,
    title: "New chat",
    created_at: now,
    updated_at: now,
  };
}

export async function loadMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  const db = await database;
  return db.getAllAsync<ChatMessage>(
    "SELECT id, role, content FROM messages WHERE conversation_id = ? ORDER BY id",
    conversationId
  );
}

export async function saveMessage(
  role: MessageRole,
  content: string,
  conversationId: number
): Promise<ChatMessage> {
  const db = await database;
  const now = Date.now();
  const result = await db.runAsync(
    "INSERT INTO messages (role, content, created_at, conversation_id) VALUES (?, ?, ?, ?)",
    role,
    content,
    now,
    conversationId
  );
  await db.runAsync(
    `UPDATE conversations
     SET updated_at = ?
     WHERE id = ?`,
    now,
    conversationId
  );
  return { id: result.lastInsertRowId, role, content };
}

export async function renameConversation(
  conversationId: number,
  title: string
): Promise<void> {
  const normalizedTitle = title.trim().slice(0, 48);
  if (!normalizedTitle) {
    throw new Error("Conversation title cannot be empty.");
  }

  const db = await database;
  await db.runAsync(
    "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
    normalizedTitle,
    Date.now(),
    conversationId
  );
}

export async function deleteConversation(
  conversationId: number
): Promise<void> {
  const db = await database;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM messages WHERE conversation_id = ?",
      conversationId
    );
    const result = await db.runAsync(
      "DELETE FROM conversations WHERE id = ?",
      conversationId
    );
    if (result.changes === 0) {
      throw new Error("This conversation no longer exists.");
    }
  });
}

