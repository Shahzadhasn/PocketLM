import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "../types/chat";

type Props = {
  isReady: boolean;
  messages: ChatMessage[];
};

function splitSources(content: string): { answer: string; sources: string | null } {
  const marker = "\n\nSources: ";
  const markerIndex = content.lastIndexOf(marker);
  if (markerIndex === -1) return { answer: content, sources: null };
  return {
    answer: content.slice(0, markerIndex),
    sources: content.slice(markerIndex + marker.length),
  };
}

function renderInlineFormatting(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    return (
      <Text key={index} style={isBold ? styles.strong : undefined}>
        {isBold ? part.slice(2, -2) : part}
      </Text>
    );
  });
}

function renderAssistantText(text: string) {
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={styles.paragraphGap} />;

    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      return (
        <Text key={index} style={styles.responseHeading}>
          {renderInlineFormatting(heading[1])}
        </Text>
      );
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^(\d+[.)])\s+(.+)$/);
    if (bullet || numbered) {
      const marker = bullet ? "•" : numbered?.[1];
      const itemText = bullet ? bullet[1] : numbered?.[2];
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listMarker}>{marker}</Text>
          <Text style={styles.responseText}>
            {renderInlineFormatting(itemText ?? "")}
          </Text>
        </View>
      );
    }

    return (
      <Text key={index} style={styles.responseParagraph}>
        {renderInlineFormatting(trimmed)}
      </Text>
    );
  });
}

function AssistantResponse({ content }: { content: string }) {
  const { answer, sources } = splitSources(content);

  return (
    <View style={styles.assistantCard}>
      <View style={styles.responseBody}>{renderAssistantText(answer)}</View>
      {sources ? (
        <View style={styles.sources}>
          <View style={styles.sourcesHeader}>
            <Ionicons name="book-outline" size={15} color="#477064" />
            <Text style={styles.sourcesTitle}>Sources</Text>
          </View>
          <Text style={styles.sourcesText}>{sources}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function MessageList({ isReady, messages }: Props) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={messages}
      keyExtractor={(item) => String(item.id)}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={27} color="#246b5b" />
          </View>
          <Text style={styles.emptyTitle}>
            {isReady ? "Ready when you are" : "Loading your chat"}
          </Text>
          <Text style={styles.emptyText}>
            {isReady
              ? "Start a new conversation or choose one from your history."
              : "Please wait a moment."}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        if (item.role === "user") {
          return (
            <View style={styles.userRow}>
              <View style={styles.userMessage}>
                <Text style={styles.userText}>{item.content}</Text>
              </View>
            </View>
          );
        }

        return <AssistantResponse content={item.content} />;
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#e5f0ea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { color: "#233b31", fontSize: 18, fontWeight: "700" },
  emptyText: {
    color: "#78847e",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 6,
  },
  userRow: { alignItems: "flex-end", marginBottom: 16 },
  userMessage: {
    maxWidth: "88%",
    backgroundColor: "#dcece4",
    borderRadius: 18,
    borderBottomRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  userText: { color: "#1d332a", fontSize: 15, lineHeight: 22 },
  assistantCard: {
    alignSelf: "stretch",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7ece8",
    padding: 15,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#263a32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  responseBody: { paddingLeft: 1 },
  responseText: { flex: 1, color: "#2c3b34", fontSize: 14, lineHeight: 22 },
  responseParagraph: {
    color: "#2c3b34",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  responseHeading: {
    color: "#20392f",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 8,
  },
  strong: { fontWeight: "700", color: "#20392f" },
  paragraphGap: { height: 4 },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 7 },
  listMarker: {
    width: 23,
    color: "#246b5b",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  sources: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e9e4",
    paddingTop: 11,
    marginTop: 5,
  },
  sourcesHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sourcesTitle: { color: "#477064", fontSize: 12, fontWeight: "700" },
  sourcesText: { color: "#74817a", fontSize: 12, lineHeight: 18, marginTop: 5 },
});
