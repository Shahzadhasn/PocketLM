import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { BusyIndicator } from "../components/BusyIndicator";
import { ChatComposer } from "../components/ChatComposer";
import { HistoryDrawer } from "../components/HistoryDrawer";
import { MessageList } from "../components/MessageList";
import { useChat } from "../hooks/useChat";
import { useDocuments } from "../hooks/useDocuments";
import { colors } from "../theme/colors";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
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
  } = useChat();
  const { documents, isUploading, addDocument, removeDocument } = useDocuments();
  const isBusy = isSending || isUploading;
  const isInteractionDisabled =
    isBusy || isDeletingConversation || !isReady || activeConversationId === null;

  const handleSend = () => {
    const currentQuestion = question.trim();
    if (!currentQuestion || isInteractionDisabled) return;
    setQuestion("");
    void sendMessage(currentQuestion);
  };

  const handleNewChat = () => {
    setHistoryOpen(false);
    setQuestion("");
    void startNewChat();
  };

  const handleSelectConversation = (conversationId: number) => {
    setHistoryOpen(false);
    setQuestion("");
    void selectConversation(conversationId);
  };

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <AppHeader
          disabled={isInteractionDisabled}
          onOpenHistory={() => setHistoryOpen(true)}
          onNewChat={handleNewChat}
        />
        <MessageList isReady={isReady} messages={messages} />
        {isBusy && <BusyIndicator />}
        <ChatComposer
          disabled={isInteractionDisabled}
          question={question}
          onChangeQuestion={setQuestion}
          onAddFile={() => void addDocument()}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
      <HistoryDrawer
        visible={historyOpen}
        disabled={isInteractionDisabled}
        isUploading={isUploading}
        conversations={conversations}
        activeConversationId={activeConversationId}
        documents={documents}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={(conversationId) => void deleteChat(conversationId)}
        onAddDocument={() => void addDocument()}
        onRemoveDocument={removeDocument}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: { flex: 1 },
});
