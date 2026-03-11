"use client";

import { useCallback, useRef, useState } from "react";

/** Environment variable (client-side safe) */
const API_BASE_URL =
  typeof window !== "undefined"
    ? (window as any).NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
    : "http://localhost:5000/api";

/** Generic API response shape */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/** Processing status type */
export interface ProcessingStatus {
  status: "idle" | "processing" | "completed" | "error";
  progress: number;
  message?: string;
}

export interface BasicCleaningResponse {
  cleaned_text: string;
  applied_operations: string[];
  changes: Array<{
    operation: string;
    changed: boolean;
    before_chars: number;
    after_chars: number;
  }>;
  stats: {
    original: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
    cleaned: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
  };
}

export interface TokenizationResponse {
  token_type: "word" | "sentence" | "ngram";
  n: number | null;
  total_tokens: number;
  token_count: number;
  tokens: string[];
}

export interface TextFilteringResponse {
  filtered_text: string;
  settings: {
    remove_stop_words: boolean;
    min_word_length: number;
  };
  original_token_count: number;
  filtered_token_count: number;
  removed_token_count: number;
  tokens: string[];
  stats: {
    original: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
    cleaned: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
  };
}

export interface TextNormalizationResponse {
  normalized_text: string;
  method: "stemming" | "lemmatization" | "spell-correction";
  stemming_algorithm: "porter" | "snowball" | null;
  original_token_count: number;
  normalized_token_count: number;
  changed_token_count: number;
  tokens: string[];
  stats: {
    original: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
    cleaned: {
      char_count: number;
      word_count: number;
      line_count: number;
    };
  };
}

export type FeatureExtractionMethod = "tfidf" | "bow" | "word2vec";

export interface FeatureExtractionResponse {
  extraction_id: string | null;
  method: FeatureExtractionMethod;
  result: Record<string, any> | Array<Record<string, any>>;
  vector_length: number;
  config: {
    max_features: number;
    ngram_range: string;
    vector_size: number;
  };
}

export interface DatabaseConnectorPayload {
  db_type: "postgresql" | "mysql" | "mssql" | "sqlite";
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  schema?: string;
  table: string;
  sqlite_path?: string;
  query?: string;
}

export type DimensionalityTechnique = "pca" | "svd" | "tsne" | "umap";

export interface DimensionalityReductionRequest {
  technique: DimensionalityTechnique;
  n_components?: number;
  scale_data?: boolean;
  random_state?: number;
  perplexity?: number;
  n_neighbors?: number;
}

export interface DimensionalityReductionResponse {
  technique: DimensionalityTechnique;
  // technique: string
  download_id: string
  input_shape: {
    rows: number;
    columns: number;
  };
  numeric_columns: string[];
  n_components?: number;
  scale_data: boolean;
  transformed_data: Array<Record<string, number>>;
  output_file: string;
  explained_variance_ratio?: number[];
  cumulative_variance?: number[];
  column_names?: string[];
}

export interface AgentChatRequest {
  dataset_type?: "structured" | "unstructured";
  summary?: Record<string, any>;
  question?: string;
  agent_mode?: boolean | string;
  model?: string;
}

export interface AgentChatResponse {
  reply: string;
  used_default_prompt: boolean;
  prompt_type: "DEFAULT_PROMPT" | "QUESTION";
  model: string;
}

export interface AutoCleaningPipelineOutput {
  duplicates_removed: number;
  missing_before: number;
  missing_after: number;
  outliers_detected: Record<string, number>;
  outlier_rows_removed: number;
  data_types_fixed: Record<string, string>;
}

export interface DatasetQualityReport {
  quality_score: number;
  rows_before: number;
  rows_after: number;
  missing_before: number;
  missing_after: number;
  duplicates_removed: number;
  outliers_before: Record<string, number>;
  outliers_after: Record<string, number>;
  issues_detected: {
    missing_values: number;
    duplicate_rows: number;
    outlier_points: number;
    incorrect_dtypes: number;
  };
  operations_performed: string[];
}

export interface AutoCleaningResponse {
  pipeline_output: AutoCleaningPipelineOutput;
  report: DatasetQualityReport;
  transformations: Array<Record<string, any>>;
  ai_explanation: string;
  cleaned_summary: Record<string, any>;
  cleaned_sample: Array<Record<string, any>>;
}

/** Hook return type (partial, inferred by TS from implementation) */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController for fetch-based requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // XHR ref for upload progress (so we can abort uploads)
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);

  /**
   * Generic API caller using fetch.
   * Cancels the previous fetch (if any) before making a new one.
   */
  const apiCall = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      // Cancel previous request if pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
          signal: controller.signal,
          ...options,
        });

        if (!response.ok) {
          // Try to parse JSON error body
          let errorData: ApiResponse<any> | null = null;
          try {
            errorData = await response.json();
          } catch {
            // ignore parse error
          }
          throw new Error(errorData?.error ?? errorData?.message ?? `HTTP error: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();

        if (!result.success) {
          throw new Error(result.error ?? result.message ?? "Operation failed");
        }

        return result.data as T;
      } catch (err) {
        // If aborted, rethrow the AbortError so caller can handle if needed
        if (err instanceof Error && (err as any).name === "AbortError") {
          throw err;
        }
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  /**
   * Poll dataset processing status.
   * Calls `onUpdate` with the latest ProcessingStatus until it is not "processing".
   */
  const pollStatus = useCallback(
    async (datasetId: string, onUpdate: (status: ProcessingStatus) => void): Promise<void> => {
      // Recursive poll using setTimeout to avoid blocking the main thread with loops
      const poll = async () => {
        try {
          const status = await apiCall<ProcessingStatus>(`/dataset/${datasetId}/status`);
          onUpdate(status);

          if (status.status === "processing") {
            // schedule next poll
            setTimeout(poll, 1000);
          }
        } catch (err) {
          // log but don't throw (caller may want to continue)
          // you can expose this error via onUpdate or other mechanism if needed
          // console.error("Error polling status:", err);
        }
      };

      poll();
    },
    [apiCall]
  );

  /**
   * Upload file with progress callback using XMLHttpRequest.
   * Returns the response.data on success.
   */
  const uploadFile = useCallback(
    (file: File, onProgress?: (percentage: number) => void): Promise<any> => {
      // Cancel any in-progress fetch or XHR
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (uploadXhrRef.current) {
        uploadXhrRef.current.abort();
      }

      setLoading(true);
      setError(null);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        uploadXhrRef.current = xhr;

        xhr.open("POST", `${API_BASE_URL}/upload`, true);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable && onProgress) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== XMLHttpRequest.DONE) return;

          setLoading(false);
          uploadXhrRef.current = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText) as ApiResponse<any>;
              if (!parsed.success) {
                const msg = parsed.error ?? parsed.message ?? "Upload failed";
                setError(msg);
                reject(new Error(msg));
                return;
              }
              resolve(parsed.data);
            } catch (e) {
              const errMsg = "Invalid JSON response from upload";
              setError(errMsg);
              reject(new Error(errMsg));
            }
          } else {
            // Try parse error body
            try {
              const parsed = JSON.parse(xhr.responseText) as ApiResponse<any>;
              const errMsg = parsed.error ?? parsed.message ?? `Upload failed: ${xhr.status}`;
              setError(errMsg);
              reject(new Error(errMsg));
            } catch {
              const errMsg = `Upload failed: ${xhr.status}`;
              setError(errMsg);
              reject(new Error(errMsg));
            }
          }
        };

        xhr.onerror = () => {
          setLoading(false);
          uploadXhrRef.current = null;
          const errMsg = "Network error during upload";
          setError(errMsg);
          reject(new Error(errMsg));
        };

        xhr.onabort = () => {
          setLoading(false);
          uploadXhrRef.current = null;
          reject(new DOMException("Upload aborted", "AbortError"));
        };

        const form = new FormData();
        form.append("file", file);
        xhr.send(form);
      });
    },
    []
  );

  // Dataset operations (all use apiCall)
  const getDatasetSummary = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/summary`),
    [apiCall]
  );

  const getDatasetPreview = useCallback(
    (datasetId: string, page = 1, perPage = 10, type = "head") =>
      apiCall(`/dataset/${datasetId}/preview?page=${page}&per_page=${perPage}&type=${type}`),
    [apiCall]
  );
  const runValidation = useCallback(
    (datasetId: string, rules: any[]) =>
      apiCall(`/validation/run/${datasetId}`, {
        method: "POST",
        body: JSON.stringify({ rules }),
      }),
    [apiCall]
  );

  const handleMissingValues = useCallback(
    (datasetId: string, strategy: string, columns?: string[], asyncParam = false) =>
      apiCall(`/dataset/${datasetId}/missing-values`, {
        method: "POST",
        body: JSON.stringify({ strategy, columns, async: asyncParam }),
      }),
    [apiCall]
  );

  const handleMissingValuesAdvanced = useCallback(
    (datasetId: string, strategy: string, columns?: string[], fillValue?: string) =>
      apiCall(`/dataset/${datasetId}/missing-values`, {
        method: "POST",
        body: JSON.stringify({ strategy, columns, fill_value: fillValue }),
      }),
    [apiCall]
  );

  const normalizeData = useCallback(
    (datasetId: string, method: string, columns?: string[], asyncParam = false) =>
      apiCall(`/dataset/${datasetId}/normalize`, {
        method: "POST",
        body: JSON.stringify({ method, columns, async: asyncParam }),
      }),
    [apiCall]
  );

  const normalizeDataAdvanced = useCallback(
    (datasetId: string, method: string, columns?: string[]) =>
      apiCall(`/dataset/${datasetId}/normalize`, {
        method: "POST",
        body: JSON.stringify({ method, columns }),
      }),
    [apiCall]
  );

  const encodeCategorical = useCallback(
    (datasetId: string, method: string, columns?: string[], asyncParam = false) =>
      apiCall(`/dataset/${datasetId}/encode`, {
        method: "POST",
        body: JSON.stringify({ method, columns, async: asyncParam }),
      }),
    [apiCall]
  );

  const encodeCategoricalAdvanced = useCallback(
    (datasetId: string, method: string, columns?: string[]) =>
      apiCall(`/dataset/${datasetId}/encode`, {
        method: "POST",
        body: JSON.stringify({ method, columns }),
      }),
    [apiCall]
  );

  const removeOutliers = useCallback(
    (datasetId: string, method: string, columns?: string[], threshold = 1.5, asyncParam = false) =>
      apiCall(`/dataset/${datasetId}/outliers`, {
        method: "POST",
        body: JSON.stringify({ method, columns, threshold, async: asyncParam }),
      }),
    [apiCall]
  );
  
  const applyClassBalancing = async (
  datasetId: string,
  target: string,
  method: "random_over" | "random_under" | "smote" | "smote_tomek" | "class_weight"
) => {
  return apiCall(`/dataset/${datasetId}/balance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target,
      method,
    }),
  })
}


  const removeDuplicates = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/duplicates`, { method: "DELETE" }),
    [apiCall]
  );

  const runAutoCleaning = useCallback(
    (datasetId: string) => apiCall<AutoCleaningResponse>(`/dataset/${datasetId}/auto-clean`, { method: "POST" }),
    [apiCall]
  );

  const getCorrelationAnalysis = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/correlation`),
    [apiCall]
  );

  const exportDataset = useCallback(async (datasetId: string) => {
    const resp = await fetch(`${API_BASE_URL}/dataset/${datasetId}/export`);
    if (!resp.ok) throw new Error("Export failed");
    const disposition = resp.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] || "";
    const blob = await resp.blob();
    return { blob, filename };
  }, []);

  const resetDataset = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/reset`, { method: "POST" }),
    [apiCall]
  );

  const basicCleanText = useCallback(
    (text: string, operations: string[]) =>
      apiCall<BasicCleaningResponse>(`/text/basic-cleaning`, {
        method: "POST",
        body: JSON.stringify({ text, operations }),
      }),
    [apiCall]
  );

  const tokenizeText = useCallback(
    (text: string, tokenType: "word" | "sentence" | "ngram", n = 2) =>
      apiCall<TokenizationResponse>(`/text/tokenize`, {
        method: "POST",
        body: JSON.stringify({ text, token_type: tokenType, n }),
      }),
    [apiCall]
  );

  const filterText = useCallback(
    (text: string, removeStopWords = true, minWordLength = 1) =>
      apiCall<TextFilteringResponse>(`/text/filtering`, {
        method: "POST",
        body: JSON.stringify({
          text,
          remove_stop_words: removeStopWords,
          min_word_length: minWordLength,
        }),
      }),
    [apiCall]
  );

  const normalizeText = useCallback(
    (
      text: string,
      method: "stemming" | "lemmatization" | "spell-correction",
      stemmingAlgorithm: "porter" | "snowball" = "porter"
    ) =>
      apiCall<TextNormalizationResponse>(`/text/normalize`, {
        method: "POST",
        body: JSON.stringify({
          text,
          method,
          stemming_algorithm: stemmingAlgorithm,
        }),
      }),
    [apiCall]
  );

  const extractTextFeatures = useCallback(
    (
      text: string,
      method: FeatureExtractionMethod,
      maxFeatures = 1000,
      ngramRange = "1-1",
      vectorSize = 100
    ) =>
      apiCall<FeatureExtractionResponse>(`/text/feature-extraction`, {
        method: "POST",
        body: JSON.stringify({
          text,
          method,
          max_features: maxFeatures,
          ngram_range: ngramRange,
          vector_size: vectorSize,
        }),
      }),
    [apiCall]
  );

  const getProcessingHistory = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/history`),
    [apiCall]
  );

  const refreshRandomSample = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/refresh-random`, { method: "POST" }),
    [apiCall]
  );

  const testDatabaseConnection = useCallback(
    (payload: DatabaseConnectorPayload) =>
      apiCall<{ ok: boolean; query: string }>(`/database/test-connection`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [apiCall]
  );

  const connectDatabaseAndImport = useCallback(
    (payload: DatabaseConnectorPayload) =>
      apiCall<any>(`/database/connect-import`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [apiCall]
  );

  const runDimensionalityReduction = useCallback(
    (datasetId: string, payload: DimensionalityReductionRequest) =>
      apiCall<DimensionalityReductionResponse>(`/dataset/${datasetId}/dimensionality-reduction`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [apiCall]
  );

  const chatWithAgent = useCallback(
    async (payload: AgentChatRequest) => {
      const datasetType = payload.dataset_type ?? "structured";
      const summary = payload.summary ?? {};
      const question = (payload.question ?? "").trim();
      const agentModeRaw = payload.agent_mode;
      const agentModeOn =
        typeof agentModeRaw === "string"
          ? ["true", "1", "yes", "on"].includes(agentModeRaw.toLowerCase())
          : Boolean(agentModeRaw);

      const parseReply = (json: any): string =>
        json?.data?.reply ?? json?.reply ?? json?.text_output ?? "";

      try {
        const chatResp = await fetch(`${API_BASE_URL}/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (chatResp.ok) {
          const chatJson = await chatResp.json();
          if (chatJson?.success === false) {
            throw new Error(chatJson?.error ?? chatJson?.message ?? "Agent chat failed");
          }
          return {
            reply: parseReply(chatJson),
            used_default_prompt: Boolean(chatJson?.data?.used_default_prompt),
            prompt_type: (chatJson?.data?.prompt_type ?? "QUESTION") as "DEFAULT_PROMPT" | "QUESTION",
            model: chatJson?.data?.model ?? payload.model ?? "unknown",
          } as AgentChatResponse;
        }

        if (chatResp.status !== 404) {
          let chatJson: any = null;
          try {
            chatJson = await chatResp.json();
          } catch {
            // ignore parse errors and fallback to status text
          }
          throw new Error(chatJson?.error ?? chatJson?.message ?? `HTTP error: ${chatResp.status}`);
        }

        if (!agentModeOn || !question) {
          const recommendResp = await fetch(`${API_BASE_URL}/agent/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_type: datasetType, summary }),
          });
          if (!recommendResp.ok) {
            throw new Error(`HTTP error: ${recommendResp.status}`);
          }
          const recommendJson = await recommendResp.json();
          const reply = parseReply(recommendJson);
          return {
            reply,
            used_default_prompt: true,
            prompt_type: "DEFAULT_PROMPT",
            model: payload.model ?? "unknown",
          } as AgentChatResponse;
        }

        const askResp = await fetch(`${API_BASE_URL}/agent/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataset_type: datasetType, summary, question }),
        });
        if (!askResp.ok) {
          throw new Error(`HTTP error: ${askResp.status}`);
        }
        const askJson = await askResp.json();
        const reply = parseReply(askJson);
        return {
          reply,
          used_default_prompt: false,
          prompt_type: "QUESTION",
          model: payload.model ?? "unknown",
        } as AgentChatResponse;
      } catch (err) {
        if (err instanceof Error && (err as any).name === "AbortError") {
          throw new Error("Agent request was cancelled.");
        }
        throw err;
      }
    },
    []
  );

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
  }, []);

  return {
    loading,
    error,
    apiCall,
    uploadFile,
    getDatasetSummary,
    getDatasetPreview,
    handleMissingValues,
    handleMissingValuesAdvanced,
    normalizeData,
    normalizeDataAdvanced,
    encodeCategorical,
    encodeCategoricalAdvanced,
    removeOutliers,
    applyClassBalancing,
    removeDuplicates,
    runAutoCleaning,
    getCorrelationAnalysis,
    exportDataset,
    resetDataset,
    getProcessingHistory,
    refreshRandomSample,
    testDatabaseConnection,
    connectDatabaseAndImport,
    runDimensionalityReduction,
    chatWithAgent,
    runValidation,
    basicCleanText,
    tokenizeText,
    filterText,
    normalizeText,
    extractTextFeatures,
    pollStatus,
    cancelRequest,
  };
}
