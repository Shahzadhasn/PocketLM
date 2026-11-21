import { useCallback, useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import {
  deleteDocument as deleteDocumentRequest,
  fetchDocuments,
  uploadDocument,
} from "../services/ragApi";
import type { RagDocument } from "../types/document";

export function useDocuments() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setDocuments(await fetchDocuments());
  }, []);

  useEffect(() => {
    refreshDocuments().catch((error: unknown) => {
      Alert.alert(
        "Documents error",
        error instanceof Error ? error.message : String(error)
      );
    });
  }, [refreshDocuments]);

  const addDocument = useCallback(async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain"],
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;

    const asset = picked.assets[0];
    setIsUploading(true);
    try {
      const result = await uploadDocument({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      await refreshDocuments();
      Alert.alert("Added to library", result.name ?? asset.name);
    } catch (error) {
      Alert.alert(
        "Upload error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsUploading(false);
    }
  }, [refreshDocuments]);

  const removeDocument = useCallback(
    async (document: RagDocument) => {
      try {
        await deleteDocumentRequest(document.id);
        await refreshDocuments();
      } catch (error) {
        Alert.alert(
          "Delete error",
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    [refreshDocuments]
  );

  return { documents, isUploading, addDocument, removeDocument };
}
