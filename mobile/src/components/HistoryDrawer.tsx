import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import type { Conversation } from "../types/chat";
import type { RagDocument } from "../types/document";

type Props = {
  visible: boolean;
  disabled: boolean;
  isUploading: boolean;
  conversations: Conversation[];
  activeConversationId: number | null;
  documents: RagDocument[];
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: number) => void;
  onDeleteConversation: (conversationId: number) => void;
  onAddDocument: () => void;
  onRemoveDocument: (document: RagDocument) => void;
};

function formatUpdatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function HistoryDrawer({
  visible,
  disabled,
  isUploading,
  conversations,
  activeConversationId,
  documents,
  onClose,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onAddDocument,
  onRemoveDocument,
}: Props) {
  const insets = useSafeAreaInsets();

  const confirmRemoval = (document: RagDocument) => {
    Alert.alert("Remove from library?", document.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemoveDocument(document),
      },
    ]);
  };

  const confirmConversationRemoval = (conversation: Conversation) => {
    Alert.alert(
      "Delete chat?",
      `Delete "${conversation.title}" and all its messages? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteConversation(conversation.id),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close chat history"
        />
        <View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.heading}>
            <Text style={styles.title}>Chats & Library</Text>
            <Pressable
              style={styles.closeButton}
              onPress={onNewChat}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel="Start a new chat"
            >
              <Ionicons name="add-circle-outline" size={25} color="#244d40" />
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close chat history"
            >
              <Ionicons name="close" size={23} color="#53665e" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.library}>
              <View style={styles.libraryHeader}>
                <View style={styles.libraryLabel}>
                  <Ionicons name="folder-open-outline" size={19} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Library</Text>
                  <Text style={styles.count}>{documents.length}</Text>
                </View>
                <Pressable
                  style={[styles.addDocumentButton, isUploading && styles.disabled]}
                  onPress={onAddDocument}
                  disabled={disabled || isUploading}
                  accessibilityRole="button"
                  accessibilityLabel="Add a document to the library"
                >
                  <Ionicons name="add" size={21} color={colors.primary} />
                </Pressable>
              </View>
              {documents.length === 0 ? (
                <Text style={styles.emptyLibrary}>
                  Add a PDF or TXT file to keep it in your library.
                </Text>
              ) : (
                documents.map((document) => (
                  <View key={document.id} style={styles.document}>
                    <Ionicons
                      name="document-text-outline"
                      size={17}
                      color="#77877f"
                    />
                    <View style={styles.documentText}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {document.name}
                      </Text>
                      <Text style={styles.documentDetail}>
                        {document.chunks} text chunks
                      </Text>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => confirmRemoval(document)}
                      disabled={disabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${document.name} from library`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#78847e" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionTitle}>Recent chats</Text>
            {conversations.length === 0 ? (
              <Text style={styles.empty}>Your conversations will appear here.</Text>
            ) : (
              conversations.map((item) => {
                const selected = item.id === activeConversationId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.conversation, selected && styles.selected]}
                    onPress={() => onSelectConversation(item.id)}
                    onLongPress={() => confirmConversationRemoval(item)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityHint="Long press to delete this chat"
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color={selected ? colors.primary : "#77877f"}
                    />
                    <View style={styles.conversationText}>
                      <Text style={styles.conversationTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.date}>
                        {formatUpdatedAt(item.updated_at)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 23, 18, 0.42)",
  },
  drawer: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#fbfcfa",
    paddingHorizontal: 18,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  title: { flex: 1, color: "#152d27", fontSize: 21, fontWeight: "700" },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  library: {
    backgroundColor: "#f1f5f2",
    borderRadius: 12,
    padding: 11,
    marginBottom: 22,
  },
  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  libraryLabel: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  addDocumentButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#75837c",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 0,
  },
  count: { color: "#75837c", fontSize: 11 },
  emptyLibrary: {
    color: "#84918b",
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 10,
  },
  document: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#dce5df",
  },
  documentText: { flex: 1 },
  documentName: { color: "#34473f", fontSize: 13, fontWeight: "600" },
  documentDetail: { color: "#84918b", fontSize: 10, marginTop: 2 },
  removeButton: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  conversation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 11,
  },
  selected: { backgroundColor: "#e7f0eb" },
  conversationText: { flex: 1 },
  conversationTitle: { color: "#263a32", fontSize: 14, fontWeight: "600" },
  date: { color: "#84918b", fontSize: 11, marginTop: 3 },
  empty: { color: "#84918b", fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  disabled: { opacity: 0.55 },
});
