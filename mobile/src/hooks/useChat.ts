import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  createConversation,
  deleteConversation,
  initializeChatStorage,
  listConversations,
  loadMessages,
  renameConversation,
  saveMessage,
} from "../services/chatStorage";
import { sendChatMessage } from "../services/ragApi";
import type { ChatMessage, Conversation } from "../types/chat";

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initializeChatStorage();
        const storedConversations = await listConversations();
        const currentConversation =
          storedConversations[0] ?? (await createConversation());
        const conversationsWithCurrent =
          storedConversations.length > 0
            ? storedConversations
            : [currentConversation];
        const storedMessages = await loadMessages(currentConversation.id);
        if (active) {
          setConversations(conversationsWithCurrent);
          setActiveConversationId(currentConversation.id);
          setMessages(storedMessages);
          setIsReady(true);
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            "Storage error",
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const startNewChat = useCallback(async () => {
    try {
      const conversation = await createConversation();
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      Alert.alert(
        "Storage error",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, []);

  const selectConversation = useCallback(async (conversationId: number) => {
    try {
      const storedMessages = await loadMessages(conversationId);
      setActiveConversationId(conversationId);
      setMessages(storedMessages);
    } catch (error) {
      Alert.alert(
        "Storage error",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, []);

  const deleteChat = useCallback(
    async (conversationId: number) => {
      if (isDeletingConversation) return;
      setIsDeletingConversation(true);
      try {
        await deleteConversation(conversationId);
        const deletingActive = conversationId === activeConversationId;
        if (deletingActive) {
          setActiveConversationId(null);
          setMessages([]);
        }

        const remaining = await listConversations();
        setConversations(remaining);
        if (deletingActive) {
          const nextConversation = remaining[0] ?? (await createConversation());
          const nextConversations =
            remaining.length > 0 ? remaining : [nextConversation];
          const nextMessages = await loadMessages(nextConversation.id);
          setConversations(nextConversations);
          setActiveConversationId(nextConversation.id);
          setMessages(nextMessages);
        }
      } catch (error) {
        Alert.alert(
          "Delete chat error",
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setIsDeletingConversation(false);
      }
    },
    [activeConversationId, isDeletingConversation]
  );

  const sendMessage = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || isSending || activeConversationId === null) return;

      setIsSending(true);
      try {
        const userMessage = await saveMessage(
          "user",
          question,
          activeConversationId
        );
        setMessages((current) => [...current, userMessage]);
        setConversations(await listConversations());

        const response = await sendChatMessage(
          question,
          messages.slice(-8).map(({ role, content }) => ({ role, content }))
        );
        const citations = (response.sources ?? [])
          .map((source) => source.document_name)
          .filter((name, index, names) => names.indexOf(name) === index);
        const answer =
          (response.answer ?? "No answer was returned.") +
          (citations.length ? `\n\nSources: ${citations.join(", ")}` : "");
        const assistantMessage = await saveMessage(
          "assistant",
          answer,
          activeConversationId
        );
        setMessages((current) => [...current, assistantMessage]);
        if (response.title?.trim()) {
          try {
            await renameConversation(activeConversationId, response.title);
          } catch (error) {
            Alert.alert(
              "Title error",
              error instanceof Error ? error.message : String(error)
            );
          }
        }
        setConversations(await listConversations());
      } catch (error) {
        Alert.alert(
          "Chat error",
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, isSending, messages]
  );

  return {
    conversations,
    activeConversationId,
    messages,
    isReady,
    isSending,
    isDeletingConversation,
    sendMessage,
    startNewChat,
    selectConversation,
    deleteChat,
  };
}
