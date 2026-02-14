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
  token_count: number;
  tokens: string[];
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

  const getProcessingHistory = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/history`),
    [apiCall]
  );

  const refreshRandomSample = useCallback(
    (datasetId: string) => apiCall(`/dataset/${datasetId}/refresh-random`, { method: "POST" }),
    [apiCall]
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
    getCorrelationAnalysis,
    exportDataset,
    resetDataset,
    getProcessingHistory,
    refreshRandomSample,
    runValidation,
    basicCleanText,
    tokenizeText,
    pollStatus,
    cancelRequest,
  };
}
