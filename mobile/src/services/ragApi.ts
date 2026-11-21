import { API_URL } from "../config/api";
import type { ChatHistoryMessage } from "../types/chat";
import type {
  ChatResponse,
  RagDocument,
  UploadResponse,
} from "../types/document";

async function getErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json()) as { detail?: string };
  return payload.detail ?? `${fallback} (${response.status}).`;
}

export async function fetchDocuments(): Promise<RagDocument[]> {
  const response = await fetch(`${API_URL}/api/documents`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Could not load documents"));
  }
  return (await response.json()) as RagDocument[];
}

export async function uploadDocument(file: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<UploadResponse> {
  type NativeFilePart = { uri: string; name: string; type: string };
  type NativeFormData = FormData & {
    append(name: string, value: NativeFilePart): void;
  };

  const form = new FormData() as NativeFormData;
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/octet-stream",
  });

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_URL}/api/documents`);
    request.onload = () => {
      let payload: UploadResponse;
      try {
        payload = JSON.parse(request.responseText) as UploadResponse;
      } catch {
        reject(
          new Error(`Upload returned an invalid response (${request.status}).`)
        );
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(
          new Error(payload.detail ?? `Upload failed (${request.status}).`)
        );
        return;
      }
      resolve(payload);
    };
    request.onerror = () => {
      reject(new Error("Network error while uploading the document."));
    };
    request.onabort = () => {
      reject(new Error("Document upload was cancelled."));
    };
    request.send(form);
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Delete failed"));
  }
}

export async function sendChatMessage(
  question: string,
  history: ChatHistoryMessage[]
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });
  const payload = (await response.json()) as ChatResponse;
  if (!response.ok) {
    throw new Error(payload.detail ?? `Request failed (${response.status}).`);
  }
  return payload;
}
