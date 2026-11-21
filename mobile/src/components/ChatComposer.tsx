import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type Props = {
  disabled: boolean;
  question: string;
  onChangeQuestion: (value: string) => void;
  onAddFile: () => void;
  onSend: () => void;
};

export function ChatComposer({
  disabled,
  question,
  onChangeQuestion,
  onAddFile,
  onSend,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.attachButton, disabled && styles.disabled]}
        onPress={onAddFile}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Add a document"
      >
        <Ionicons name="add-circle-outline" size={27} color="#246b5b" />
      </Pressable>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={onChangeQuestion}
        placeholder="Message PocketLM"
        multiline
        maxLength={4000}
        editable={!disabled}
        onSubmitEditing={onSend}
      />
      <Pressable
        style={[
          styles.button,
          (disabled || !question.trim()) && styles.disabled,
        ]}
        onPress={onSend}
        disabled={disabled || !question.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Ionicons name="send" size={16} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 12,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dfe5e0",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#1d2c26",
  },
  attachButton: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#246b5b",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
});
