import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  disabled: boolean;
  onOpenHistory: () => void;
  onNewChat: () => void;
};

export function AppHeader({ disabled, onOpenHistory, onNewChat }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.historyButton, disabled && styles.disabled]}
        onPress={onOpenHistory}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Open chat history"
      >
        <Ionicons name="menu-outline" size={25} color="#244d40" />
      </Pressable>
      <Text style={styles.title}>PocketLM</Text>
      <Pressable
        style={[styles.historyButton, disabled && styles.disabled]}
        onPress={onNewChat}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Start a new chat"
      >
        <Ionicons name="add-circle-outline" size={25} color="#244d40" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { flex: 1, fontSize: 24, fontWeight: "700", color: "#152d27" },
  disabled: { opacity: 0.5 },
});
