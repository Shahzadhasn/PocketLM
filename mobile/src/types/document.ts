export type RagSource = {
  document_id: string;
  document_name: string;
  score: number;
};

export type RagDocument = {
  id: string;
  name: string;
  chunks: number;
};

export type ChatResponse = {
  answer?: string;
  sources?: RagSource[];
  title?: string;
  detail?: string;
};

export type UploadResponse = {
  detail?: string;
  name?: string;
};
