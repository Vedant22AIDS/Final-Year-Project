"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { LeftSidebar } from "./Left-sidebar.tsx"
import { MainContent } from "./Main-content.tsx"
import { RightSidebar } from "./Right-sidebar.tsx"
import { TopNavbar } from "./Top-navbar.tsx"
import { LoadingOverlay } from "../components/ui/loading-overlay.tsx"
import { ScrollArea } from "../components/ui/ScrollArea.tsx"
import { useApi } from "../hooks/use-api.ts"
import type { DatabaseConnectorPayload } from "../hooks/use-api.ts"
import type { DimensionalityReductionResponse } from "../hooks/use-api.ts"
import type { CleaningOption } from "../features/text-preprocessing/basic-cleaning.tsx"
import type { TextNormalizationConfig } from "../features/text-preprocessing/normalization-panel.tsx"
import type { FeatureExtractionConfig } from "../features/text-preprocessing/feature-extraction.tsx"
import { toast } from "sonner"

export type LogEntry = {
  title: string
  date: string
  details: string
  type?: "info" | "warning" | "error"
}

interface ProcessingStatus {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  message: string
}

type AppliedDimensionality = {
  technique: string
  downloadId: string
  outputFile: string
}

type AppliedImbalance = {
  technique: string
  downloadId: string
  outputFile: string
}

const APPLIED_DR_STORAGE_KEY = "applied_dimensionality_result"
const APPLIED_IMBALANCE_STORAGE_KEY = "applied_imbalance_result"

type DataKind = "none" | "structured" | "unstructured"

type UnstructuredDataPayload = {
  text: string
  fileName: string
  charCount: number
  wordCount: number
  lineCount: number
}

type TokenizationConfig = {
  method: "word" | "sentence" | "ngram"
  nGramSize: number
}

type FilteringConfig = {
  removeStopWords: boolean
  minWordLength: number
}

const WORD_TOKEN_REGEX = /[^\W_]+(?:'[^\W_]+)?/gu
const FILTER_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by", "can", "could", "did", "do",
  "does", "doing", "for", "from", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
  "most", "my", "myself", "no", "nor", "not", "of", "on", "or", "our", "ours", "ourselves", "out", "over",
  "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
  "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
  "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "you",
  "your", "yours", "yourself", "yourselves", "am", "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't",
  "didn't", "can't", "couldn't", "won't", "wouldn't", "shouldn't", "hasn't", "haven't", "hadn't", "i'm", "you're",
  "we're", "they're", "he's", "she's", "it's", "that's", "there's", "here's", "i've", "you've", "we've", "they've",
  "i'll", "you'll", "we'll", "they'll", "i'd", "you'd", "we'd", "they'd", "s", "t", "d", "ll", "m", "re", "ve",
])

const filterTextLocally = (text: string, removeStopWords: boolean, minWordLength: number) => {
  const originalTokens = text.match(WORD_TOKEN_REGEX) || []
  const filteredTokens = originalTokens.filter((token) => {
    if (removeStopWords && FILTER_STOP_WORDS.has(token.toLowerCase())) return false
    return token.length >= minWordLength
  })
  return {
    filteredText: filteredTokens.join(" "),
    removedTokenCount: originalTokens.length - filteredTokens.length,
    filteredTokenCount: filteredTokens.length,
  }
}

const LOCAL_LEMMA_MAP: Record<string, string> = {
  running: "run",
  better: "good",
  children: "child",
  went: "go",
  was: "be",
  were: "be",
}

const COMMON_MISSPELLINGS_LOCAL: Record<string, string> = {
  definately: "definitely",
  occured: "occurred",
  untill: "until",
  wich: "which",
  becuase: "because",
  adress: "address",
  enviroment: "environment",
  goverment: "government",
  accomodate: "accommodate",
  calender: "calendar",
  concious: "conscious",
  dependant: "dependent",
  embarass: "embarrass",
  existance: "existence",
  foriegn: "foreign",
  happend: "happened",
  immediatly: "immediately",
  independant: "independent",
}

const correctSpellingLocally = (token: string) => {
  if (!/^[A-Za-z]+$/.test(token) || token.length <= 2) return token
  const lower = token.toLowerCase()
  if (COMMON_MISSPELLINGS_LOCAL[lower]) return COMMON_MISSPELLINGS_LOCAL[lower]
  const squashed = lower.replace(/(.)\1{2,}/g, "$1$1")
  if (squashed !== lower) return squashed
  return token
}

const stemTokenLocally = (token: string, algorithm: "porter" | "snowball") => {
  const lower = token.toLowerCase()
  if (lower.length <= 3) return token

  let stem = lower
  if (stem.endsWith("ies") && stem.length > 4) {
    stem = stem.slice(0, -3) + "y"
  } else if (stem.endsWith("ing") && stem.length > 5) {
    stem = stem.slice(0, -3)
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && !"lsz".includes(stem[stem.length - 1])) {
      stem = stem.slice(0, -1)
    }
  } else if (stem.endsWith("ed") && stem.length > 4) {
    stem = stem.slice(0, -2)
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && !"lsz".includes(stem[stem.length - 1])) {
      stem = stem.slice(0, -1)
    }
  } else if (algorithm === "snowball" && stem.endsWith("ly") && stem.length > 4) {
    stem = stem.slice(0, -2)
  }
  return stem
}

const normalizeTextLocally = (
  text: string,
  method: TextNormalizationConfig["method"],
  stemmingAlgorithm: TextNormalizationConfig["stemmingAlgorithm"],
) => {
  const tokens = text.match(WORD_TOKEN_REGEX) || []
  const normalizedTokens = tokens.map((token) => {
    const lower = token.toLowerCase()
    if (method === "stemming") return stemTokenLocally(token, stemmingAlgorithm)
    if (method === "lemmatization") {
      if (LOCAL_LEMMA_MAP[lower]) return LOCAL_LEMMA_MAP[lower]
      if (lower.endsWith("ies") && lower.length > 4) return lower.slice(0, -3) + "y"
      if (lower.endsWith("s") && lower.length > 4 && !lower.endsWith("ss") && !lower.endsWith("us") && !lower.endsWith("is")) {
        return lower.slice(0, -1)
      }
      return token
    }
    return correctSpellingLocally(token)
  })
  const normalizedText = normalizedTokens.join(" ")
  return {
    normalizedText,
    changedTokenCount: normalizedTokens.reduce((acc, token, idx) => acc + (token !== tokens[idx] ? 1 : 0), 0),
    normalizedTokenCount: normalizedTokens.length,
  }
}

const buildFeatureExtractionFallback = (
  text: string,
  method: FeatureExtractionConfig["method"],
  maxFeatures: number,
  vectorSize: number,
) => {
  const tokens = (text.match(WORD_TOKEN_REGEX) || []).map((t) => t.toLowerCase())
  const vocabCounts: Record<string, number> = {}
  for (const token of tokens) {
    vocabCounts[token] = (vocabCounts[token] || 0) + 1
  }
  const sortedTerms = Object.entries(vocabCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(10, Math.min(10000, maxFeatures)))

  if (method === "bow") {
    return {
      id: "doc1",
      values: Object.fromEntries(sortedTerms.map(([term, count]) => [term, count])),
    }
  }

  if (method === "tfidf") {
    const totalTerms = tokens.length || 1
    return {
      id: "doc1",
      values: Object.fromEntries(
        sortedTerms.map(([term, count]) => [term, Number((count / totalTerms).toFixed(6))]),
      ),
    }
  }

  const size = Math.max(10, Math.min(1024, vectorSize))
  const values = Array.from({ length: size }, (_, idx) => {
    const seed = (tokens[idx % Math.max(tokens.length, 1)] || "token").charCodeAt(0) + idx * 31
    return Number((((seed % 200) - 100) / 100).toFixed(6))
  })
  return [
    {
      id: "1",
      values,
      metadata: {
        text,
      },
    },
  ]
}

export function DataPreprocessingApp() {
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [dataKind, setDataKind] = useState<DataKind>("none")
  const [unstructuredData, setUnstructuredData] = useState<UnstructuredDataPayload | null>(null)
  const [tokenizationBaseText, setTokenizationBaseText] = useState<string>("")
  const [lastTextTransform, setLastTextTransform] = useState<"processed" | "cleaned" | "tokenized" | "filtered" | "normalized" | "feature-extraction">("processed")
  const [featureExtractionResult, setFeatureExtractionResult] = useState<any | null>(null)
  const [tokenizationResult, setTokenizationResult] = useState<any | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"Head" | "Tail" | "Random Sample">("Head")
  const [technique, setTechnique] = useState({
    column: "No data loaded",
    count: "0",
    missing: "0",
    mean: "0",
    categories: "0",
  })
  const [analysisMode, setAnalysisMode] = useState<
    | "overview"
    | "visualization"
    | "summary"
    | "correlation"
    | "imbalance"
    | "pca"
    | "missing-values-advanced"
    | "missing-values-quick"
    | "normalization"
    | "outliers"
    | "database-connectors"
    | "validation"
    | "text-preprocessing-basic-cleaning"
    | "text-preprocessing-tokenization"
    | "text-preprocessing-filtering"
    | "text-preprocessing-feature-extraction"
    | "text-preprocessing-normalization"
    | "text-preprocessing-label-encoding"
    | "text-preprocessing-import-data"



  >("overview")
  // 🔹 Text Preprocessing – Normalization
  const handleTextNormalizationClick = () => {
    if (!ensureUnstructuredData()) return
    setAnalysisMode("text-preprocessing-normalization");
  };

  const [summaryData, setSummaryData] = useState<any>(null)
  const [datasetSummary, setDatasetSummary] = useState<any>(null)
  const [correlationData, setCorrelationData] = useState<any>(null)
  const [appliedDimensionality, setAppliedDimensionality] = useState<AppliedDimensionality | null>(null)
  const [appliedImbalance, setAppliedImbalance] = useState<AppliedImbalance | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: "idle",
    progress: 0,
    message: "",
  })

  // Add ref to prevent multiple API calls
  const [isLoading, setIsLoading] = useState(false)
  const [lastActiveTab, setLastActiveTab] = useState<string>("")

  const api = useApi()

  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [log, ...prev.slice(0, 49)]) // Keep only last 50 logs
  }, [])

  const updateDataFromSummary = useCallback((summary: any) => {
    if (!summary) return
    setDatasetSummary(summary)

    const columns = summary.columns || []
    const missingValues = summary.missing_values || {}
    const totalMissing = Object.values(missingValues).reduce((sum: number, val: any) => sum + val, 0)

    // Calculate stats for technique panel
    const categoricalColumns = Object.entries(summary.dtypes || {}).filter(([_, dtype]) =>
      (dtype as string).includes("object"),
    ).length

    // Calculate mean for first numeric column
    let meanValue = "0"
    if (summary.numerical_stats) {
      const firstNumericCol = Object.keys(summary.numerical_stats)[0]
      if (firstNumericCol && summary.numerical_stats[firstNumericCol]?.mean) {
        meanValue = summary.numerical_stats[firstNumericCol].mean.toFixed(2)
      }
    }

    setTechnique({
      column: columns.length > 0 ? `${columns[0]} / ${columns.length}` : "No columns",
      count: summary.shape?.[0]?.toLocaleString() || "0",
      missing: totalMissing.toLocaleString(),
      mean: meanValue,
      categories: categoricalColumns.toString(),
    })
  }, [])

  const refreshPreviewData = useCallback(async () => {
    if (!datasetId || isLoading) return

    // Prevent multiple calls for the same tab
    if (lastActiveTab === activeTab) return

    try {
      setIsLoading(true)
      setLastActiveTab(activeTab)

      // Fix the view type mapping
      let viewType = activeTab.toLowerCase()
      if (viewType === "random sample") {
        viewType = "random" // Use 'random' instead of 'randomsample'
      }

      console.log(`Loading ${viewType} data for dataset ${datasetId}`)

      const previewData = await api.getDatasetPreview(datasetId, 1, 10, viewType) as { data?: any[] }
      setTableData(previewData.data || [])

      // Log the action
      addLog({
        title: `${activeTab} Data Loaded`,
        date: new Date().toLocaleString(),
        details: `Loaded ${previewData.data?.length || 0} rows for ${activeTab} view`,
        type: "info",
      })
    } catch (error) {
      console.error("Error refreshing preview:", error)
      toast.error("Failed to load preview data")
    } finally {
      setIsLoading(false)
    }
  }, [datasetId, activeTab, api, addLog, isLoading, lastActiveTab])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset state
    setDatasetId(null)
    setTableData([])
    setUnstructuredData(null)
    setTokenizationBaseText("")
    setLastTextTransform("processed")
    setFeatureExtractionResult(null)
    setTokenizationResult(null)
    setSummaryData(null)
    setDatasetSummary(null)
    setCorrelationData(null)
    setAppliedDimensionality(null)
    setAppliedImbalance(null)
    try {
      sessionStorage.removeItem(APPLIED_DR_STORAGE_KEY)
      sessionStorage.removeItem(APPLIED_IMBALANCE_STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
    setDataKind("none")
    setAnalysisMode("overview")
    setActiveTab("Head")
    setLastActiveTab("")

    try {
      setProcessingStatus({ status: "processing", progress: 0, message: "Uploading file..." })

      const result = await api.uploadFile(file, (progress) => {
        setProcessingStatus({ status: "processing", progress, message: "Uploading file..." })
      })

      setDatasetId(result.dataset_id)
      setFileName(result.filename)
      setTableData(result.sample_data || [])
      setDataKind("structured")

      updateDataFromSummary(result.summary)

      setProcessingStatus({ status: "completed", progress: 100, message: "File uploaded successfully" })

      addLog({
        title: "File Uploaded",
        date: new Date().toLocaleString(),
        details: `File "${result.filename}" uploaded successfully. ${result.summary?.shape?.[0] || 0} rows loaded.`,
        type: "info",
      })

      toast.success("File uploaded successfully!")

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed"

      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })

      addLog({
        title: "Upload Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })

      toast.error(errorMessage)

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 3000)
    }
  }

  const handleImportTextDataClick = () => {
    setAnalysisMode("text-preprocessing-import-data");

    addLog({
      title: "Import Text Data",
      date: new Date().toLocaleString(),
      details: "Opened text data import panel.",
      type: "info",
    });
  };

  const handleUnstructuredImport = (payload: UnstructuredDataPayload) => {
    setDataKind("unstructured")
    setUnstructuredData(payload)
    setTokenizationBaseText(payload.text || "")
    setDatasetId(null)
    setTableData([])
    setSummaryData(null)
    setDatasetSummary(null)
    setCorrelationData(null)
    setAppliedDimensionality(null)
    setAppliedImbalance(null)
    try {
      sessionStorage.removeItem(APPLIED_DR_STORAGE_KEY)
      sessionStorage.removeItem(APPLIED_IMBALANCE_STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
    setFileName(payload.fileName || "Unstructured Data")
    setAnalysisMode("overview")
    setLastTextTransform("processed")
    setFeatureExtractionResult(null)
    setTokenizationResult(null)

    addLog({
      title: "Unstructured Data Imported",
      date: new Date().toLocaleString(),
      details: `Loaded "${payload.fileName}" (${payload.wordCount} words, ${payload.lineCount} lines).`,
      type: "info",
    })
    toast.success("Unstructured data loaded")
  }

  const ensureStructuredData = () => {
    if (dataKind !== "structured" || !datasetId) {
      toast.error("Please import structured data (CSV/Excel) for this operation")
      return false
    }
    return true
  }

  const ensureUnstructuredData = () => {
    if (dataKind !== "unstructured" || !unstructuredData?.text?.trim()) {
      toast.error("Please import unstructured text data first")
      return false
    }
    return true
  }

  const handleProcessingOperation = async (
    operation: () => Promise<any>,
    operationName: string,
    successMessage: string,
  ) => {
    if (!datasetId) {
      toast.error("No dataset loaded")
      return
    }

    try {
      setProcessingStatus({ status: "processing", progress: 0, message: `Starting ${operationName}...` })

      // Start polling for status updates
      api.pollStatus(datasetId, (status) => {
        setProcessingStatus({
          ...status,
          message: status.message ?? ""
        })
      })

      const result = await operation()

      if (result.summary) {
        updateDataFromSummary(result.summary)
      }

      // Reset tab tracking to force refresh
      setLastActiveTab("")

      // Refresh preview data
      await refreshPreviewData()

      addLog({
        title: operationName,
        date: new Date().toLocaleString(),
        details: result.message || successMessage,
        type: "info",
      })

      toast.success(successMessage)

      setProcessingStatus({ status: "completed", progress: 100, message: successMessage })

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${operationName} failed`

      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })

      addLog({
        title: `${operationName} Error`,
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })

      toast.error(errorMessage)

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 3000)
    }
  }

  const handleImputeMissingValues = () => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.handleMissingValues(datasetId!, "mean"),
      "Missing Values Imputation",
      "Missing values handled successfully!",
    )
  }

  const handleVisualizationClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("visualization")
    addLog({
      title: "Visualization Mode",
      date: new Date().toLocaleString(),
      details: "Switched to advanced visualization mode.",
      type: "info",
    })
  }

  const handleFeatureExtractionClick = () => {
    if (!ensureUnstructuredData()) return
    setAnalysisMode("text-preprocessing-feature-extraction");

    addLog({
      title: "Feature Extraction",
      date: new Date().toLocaleString(),
      details: "Opened text feature extraction panel.",
      type: "info",
    });
  };


  const handleDataSummaryClick = async () => {
    if (!ensureStructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 50, message: "Generating data summary..." })

      const summaryRaw = await api.getDatasetSummary(datasetId)
      // Add a type assertion to ensure summary is typed
      const summary = summaryRaw as {
        shape?: [number, number]
        memory_usage?: string
        columns?: string[]
        dtypes?: { [key: string]: string }
        missing_values?: { [key: string]: number }
        numerical_stats?: { [key: string]: any }
        categorical_stats?: { [key: string]: { top_values?: { [key: string]: number } } }
      }

      // Transform backend summary to frontend format
      const transformedSummary = {
        overview: {
          totalRows: summary.shape?.[0] || 0,
          totalColumns: summary.shape?.[1] || 0,
          memoryUsage: summary.memory_usage || "0 KB",
        },
        columns:
          summary.columns?.map((colName: string) => {
            const dtype = summary.dtypes?.[colName] || "object"
            const missingCount = summary.missing_values?.[colName] || 0
            const isNumeric = dtype.includes("int") || dtype.includes("float")

            let stats: any = {
              count: (summary.shape?.[0] || 0) - missingCount,
              missing: missingCount,
              missingPercentage: ((missingCount / (summary.shape?.[0] || 1)) * 100).toFixed(1),
              unique: 0,
              uniquePercentage: "0",
            }

            if (isNumeric && summary.numerical_stats?.[colName]) {
              const numStats = summary.numerical_stats[colName]
              stats = {
                ...stats,
                mean: numStats.mean?.toFixed(2) || "0",
                median: numStats["50%"]?.toFixed(2) || "0",
                std: numStats.std?.toFixed(2) || "0",
                min: numStats.min?.toFixed(2) || "0",
                max: numStats.max?.toFixed(2) || "0",
                q25: numStats["25%"]?.toFixed(2) || "0",
                q75: numStats["75%"]?.toFixed(2) || "0",
              }
            } else if (summary.categorical_stats?.[colName]) {
              const catStats = summary.categorical_stats[colName]
              stats.topValues = Object.entries(catStats.top_values || {}).map(([value, count]) => ({
                value,
                count,
                percentage: (((count as number) / (summary.shape?.[0] || 1)) * 100).toFixed(1),
              }))
            }

            return {
              name: colName,
              dataType: isNumeric ? "numeric" : "categorical",
              isNumeric,
              isBoolean: false,
              isDate: false,
              stats,
              sampleValues: [],
            }
          }) || [],
      }

      setSummaryData(transformedSummary)
      setAnalysisMode("summary")

      setProcessingStatus({ status: "completed", progress: 100, message: "Data summary generated!" })

      addLog({
        title: "Data Summary Generated",
        date: new Date().toLocaleString(),
        details: `Generated comprehensive summary for ${summary.shape?.[0] || 0} rows and ${summary.shape?.[1] || 0} columns.`,
        type: "info",
      })

      toast.success("Data summary generated!")

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Summary generation failed"

      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })

      addLog({
        title: "Summary Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })

      toast.error(errorMessage)

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 3000)
    }
  }

  const handleCorrelationAnalysisClick = async () => {
    if (!ensureStructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 50, message: "Analyzing correlations..." })

      const correlationRaw = await api.getCorrelationAnalysis(datasetId)
      const correlation = correlationRaw as { numericalColumns?: any[] }
      setCorrelationData(correlation)
      setAnalysisMode("correlation")

      setProcessingStatus({ status: "completed", progress: 100, message: "Correlation analysis completed!" })

      addLog({
        title: "Correlation Analysis Complete",
        date: new Date().toLocaleString(),
        details: `Analyzed correlations between ${correlation.numericalColumns?.length || 0} numerical variables.`,
        type: "info",
      })

      toast.success("Correlation analysis completed!")

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Correlation analysis failed"

      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })

      addLog({
        title: "Correlation Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })

      toast.error(errorMessage)

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 3000)
    }
  }

  const handleBackToOverview = () => {
    setAnalysisMode("overview")
    addLog({
      title: "Overview Mode",
      date: new Date().toLocaleString(),
      details: "Returned to data overview mode.",
      type: "info",
    })
  }
  const handleValidationClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("validation")

    addLog({
      title: "Validation Mode",
      date: new Date().toLocaleString(),
      details: "Opened validation & test dashboard.",
      type: "info",
    })
  }

  const handleBasicCleaningClick = () => {
    if (!ensureUnstructuredData()) return

    setAnalysisMode("text-preprocessing-basic-cleaning")

    addLog({
      title: "Basic Cleaning",
      date: new Date().toLocaleString(),
      details: "Opened basic text preprocessing panel.",
      type: "info",
    })
  }

  const handleBasicCleaningApply = async (options: CleaningOption[]) => {
    if (!ensureUnstructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Applying basic text cleaning..." })

      const result = await api.basicCleanText(unstructuredData!.text, options)
      const cleaned = result.cleaned_text || ""
      const cleanedStats = result.stats?.cleaned

      setUnstructuredData({
        text: cleaned,
        fileName: unstructuredData!.fileName,
        charCount: cleanedStats?.char_count ?? cleaned.length,
        wordCount: cleanedStats?.word_count ?? (cleaned.trim() ? cleaned.trim().split(/\s+/).length : 0),
        lineCount: cleanedStats?.line_count ?? (cleaned ? cleaned.split("\n").length : 0),
      })
      setTokenizationBaseText(cleaned)
      setLastTextTransform("cleaned")
      setFeatureExtractionResult(null)
      setTokenizationResult(null)

      setProcessingStatus({ status: "completed", progress: 100, message: "Basic cleaning applied successfully" })

      addLog({
        title: "Basic Cleaning Applied",
        date: new Date().toLocaleString(),
        details: `Applied operations: ${options.join(", ")}`,
        type: "info",
      })

      toast.success("Basic cleaning applied")

      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)

      return { cleanedText: cleaned }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Basic cleaning failed"
      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
      toast.error(errorMessage)
      addLog({
        title: "Basic Cleaning Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    }
  }
  const handleTokenizationClick = () => {
    if (!ensureUnstructuredData()) return

    setAnalysisMode("text-preprocessing-tokenization")

    addLog({
      title: "Tokenization",
      date: new Date().toLocaleString(),
      details: "Opened tokenization panel.",
      type: "info",
    })
  }

  const handleTokenizationApply = async ({ method, nGramSize }: TokenizationConfig) => {
    if (!ensureUnstructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Applying tokenization..." })

      const sourceForTokenization = tokenizationBaseText.trim() ? tokenizationBaseText : unstructuredData!.text
      const result = await api.tokenizeText(sourceForTokenization, method, method === "ngram" ? nGramSize : 2)
      const tokens = result.tokens || []
      const transformedText = method === "sentence" ? tokens.join("\n") : tokens.join(" ")
      const wordCount = (transformedText.match(WORD_TOKEN_REGEX) || []).length

      setUnstructuredData({
        text: transformedText,
        fileName: unstructuredData!.fileName,
        charCount: transformedText.length,
        wordCount,
        lineCount: transformedText ? transformedText.split(/\r?\n/).length : 0,
      })
      setTokenizationResult(result)
      setLastTextTransform("tokenized")
      setFeatureExtractionResult(null)

      setProcessingStatus({ status: "completed", progress: 100, message: "Tokenization applied successfully" })

      addLog({
        title: "Tokenization Applied",
        date: new Date().toLocaleString(),
        details: `Method: ${method}${method === "ngram" ? ` (n=${nGramSize})` : ""}. Generated ${result.total_tokens || result.token_count} tokens.`,
        type: "info",
      })

      toast.success("Tokenization applied")

      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Tokenization failed"
      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
      toast.error(errorMessage)
      addLog({
        title: "Tokenization Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    }
  }

  const handleFilteringClick = () => {
    if (!ensureUnstructuredData()) return;

    setAnalysisMode("text-preprocessing-filtering");

    addLog({
      title: "Text Filtering",
      date: new Date().toLocaleString(),
      details: "Opened text filtering panel",
      type: "info",
    });
  };

  const handleFilteringApply = async ({ removeStopWords, minWordLength }: FilteringConfig) => {
    if (!ensureUnstructuredData()) return

    const sourceText = unstructuredData!.text

    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Applying text filtering..." })

      const result = await api.filterText(sourceText, removeStopWords, minWordLength)
      const local = filterTextLocally(sourceText, removeStopWords, minWordLength)
      const filtered = local.filteredText || result.filtered_text || ""
      const filteredStats = result.stats?.cleaned

      setUnstructuredData({
        text: filtered,
        fileName: unstructuredData!.fileName,
        charCount: filteredStats?.char_count ?? filtered.length,
        wordCount: filteredStats?.word_count ?? (filtered.match(WORD_TOKEN_REGEX) || []).length,
        lineCount: filteredStats?.line_count ?? (filtered ? filtered.split(/\r?\n/).length : 0),
      })
      setTokenizationBaseText(filtered)
      setLastTextTransform("filtered")
      setFeatureExtractionResult(null)
      setTokenizationResult(null)

      setProcessingStatus({ status: "completed", progress: 100, message: "Text filtering applied successfully" })

      addLog({
        title: "Text Filtering Applied",
        date: new Date().toLocaleString(),
        details: `Removed ${local.removedTokenCount} tokens (stop words: ${removeStopWords ? "on" : "off"}, min length: ${minWordLength}).`,
        type: "info",
      })

      toast.success("Text filtering applied")

      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)

      return result
    } catch (error) {
      const local = filterTextLocally(sourceText, removeStopWords, minWordLength)

      setUnstructuredData({
        text: local.filteredText,
        fileName: unstructuredData!.fileName,
        charCount: local.filteredText.length,
        wordCount: local.filteredTokenCount,
        lineCount: local.filteredText ? local.filteredText.split(/\r?\n/).length : 0,
      })
      setTokenizationBaseText(local.filteredText)
      setLastTextTransform("filtered")
      setFeatureExtractionResult(null)
      setTokenizationResult(null)

      const errorMessage = error instanceof Error ? error.message : "Text filtering failed"
      setProcessingStatus({ status: "completed", progress: 100, message: "Text filtering applied with local fallback" })
      toast.warning("Backend filtering unavailable, applied local filtering")
      addLog({
        title: "Text Filtering Applied (Fallback)",
        date: new Date().toLocaleString(),
        details: `Local filtering removed ${local.removedTokenCount} tokens. Backend error: ${errorMessage}`,
        type: "warning",
      })
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)
    }
  }

  const handleTextNormalizationApply = async ({ method, stemmingAlgorithm }: TextNormalizationConfig) => {
    if (!ensureUnstructuredData()) return

    const sourceText = unstructuredData!.text

    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Applying text normalization..." })

      const result = await api.normalizeText(sourceText, method, stemmingAlgorithm)
      const local = normalizeTextLocally(sourceText, method, stemmingAlgorithm)
      const normalized = result.normalized_text || local.normalizedText || ""
      const normalizedStats = result.stats?.cleaned

      setUnstructuredData({
        text: normalized,
        fileName: unstructuredData!.fileName,
        charCount: normalizedStats?.char_count ?? normalized.length,
        wordCount: normalizedStats?.word_count ?? (normalized.match(WORD_TOKEN_REGEX) || []).length,
        lineCount: normalizedStats?.line_count ?? (normalized ? normalized.split(/\r?\n/).length : 0),
      })
      setTokenizationBaseText(normalized)
      setLastTextTransform("normalized")
      setFeatureExtractionResult(null)
      setTokenizationResult(null)

      setProcessingStatus({ status: "completed", progress: 100, message: "Text normalization applied successfully" })
      addLog({
        title: "Text Normalization Applied",
        date: new Date().toLocaleString(),
        details: `Method: ${method}${method === "stemming" ? ` (${stemmingAlgorithm})` : ""}. Changed ${local.changedTokenCount} tokens.`,
        type: "info",
      })
      toast.success("Text normalization applied")
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)

      return result
    } catch (error) {
      const local = normalizeTextLocally(sourceText, method, stemmingAlgorithm)
      setUnstructuredData({
        text: local.normalizedText,
        fileName: unstructuredData!.fileName,
        charCount: local.normalizedText.length,
        wordCount: local.normalizedTokenCount,
        lineCount: local.normalizedText ? local.normalizedText.split(/\r?\n/).length : 0,
      })
      setTokenizationBaseText(local.normalizedText)
      setLastTextTransform("normalized")
      setFeatureExtractionResult(null)
      setTokenizationResult(null)

      const errorMessage = error instanceof Error ? error.message : "Text normalization failed"
      setProcessingStatus({ status: "completed", progress: 100, message: "Text normalization applied with local fallback" })
      toast.warning("Backend normalization unavailable, applied local normalization")
      addLog({
        title: "Text Normalization Applied (Fallback)",
        date: new Date().toLocaleString(),
        details: `Local normalization changed ${local.changedTokenCount} tokens. Backend error: ${errorMessage}`,
        type: "warning",
      })
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)
    }
  }

  const downloadBlob = (blob: Blob, downloadName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getUnstructuredDownloadName = () =>
    `${(unstructuredData?.fileName || fileName || "text").replace(/\.[^/.]+$/, "")}_${lastTextTransform}.txt`

  const getFeatureExtractionDownloadName = () =>
    `${(unstructuredData?.fileName || fileName || "text").replace(/\.[^/.]+$/, "")}_feature_extraction.json`

  const handleFeatureExtractionApply = async ({ method, maxFeatures, ngramRange, vectorSize }: FeatureExtractionConfig) => {
    if (!ensureUnstructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Applying feature extraction..." })
      const result = await api.extractTextFeatures(unstructuredData!.text, method, maxFeatures, ngramRange, vectorSize)

      const payload = result?.result ?? buildFeatureExtractionFallback(unstructuredData!.text, method, maxFeatures, vectorSize)
      setFeatureExtractionResult(payload)
      setLastTextTransform("feature-extraction")

      setProcessingStatus({ status: "completed", progress: 100, message: "Feature extraction applied successfully" })
      addLog({
        title: "Feature Extraction Applied",
        date: new Date().toLocaleString(),
        details: `Method: ${method}. Vector length: ${result.vector_length}.`,
        type: "info",
      })
      toast.success("Feature extraction applied")
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)

      return { result: payload }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Feature extraction failed"
      const fallbackPayload = buildFeatureExtractionFallback(unstructuredData!.text, method, maxFeatures, vectorSize)
      setFeatureExtractionResult(fallbackPayload)
      setLastTextTransform("feature-extraction")
      setProcessingStatus({ status: "completed", progress: 100, message: "Feature extraction applied with local fallback" })
      toast.warning("Backend extraction unavailable, applied local feature extraction")
      addLog({
        title: "Feature Extraction Applied (Fallback)",
        date: new Date().toLocaleString(),
        details: `Local ${method} JSON generated. Backend error: ${errorMessage}`,
        type: "warning",
      })
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)
      return { result: fallbackPayload }
    }
  }

  const handleExportFile = async () => {
    if (dataKind === "unstructured") {
      if (!ensureUnstructuredData()) return

      try {
        setProcessingStatus({ status: "processing", progress: 50, message: "Preparing text export..." })

        const isFeatureExtraction = lastTextTransform === "feature-extraction"
        const featurePayload = featureExtractionResult ?? buildFeatureExtractionFallback(unstructuredData!.text, "tfidf", 1000, 100)
        const downloadName = isFeatureExtraction
          ? getFeatureExtractionDownloadName()
          : getUnstructuredDownloadName()
        const fileBlob = isFeatureExtraction
          ? new Blob([JSON.stringify(featurePayload, null, 2)], { type: "application/json;charset=utf-8" })
            : new Blob([unstructuredData!.text], { type: "text/plain;charset=utf-8" })
        downloadBlob(fileBlob, downloadName)

        setProcessingStatus({ status: "completed", progress: 100, message: "Text exported successfully!" })
        addLog({
          title: "Text Exported",
          date: new Date().toLocaleString(),
          details: `${isFeatureExtraction ? "Feature extraction JSON" : "Processed text"} exported as ${downloadName}`,
          type: "info",
        })
        toast.success(isFeatureExtraction ? "Feature extraction JSON exported" : "Processed text exported")

        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Text export failed"
        setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
        addLog({
          title: "Text Export Error",
          date: new Date().toLocaleString(),
          details: errorMessage,
          type: "error",
        })
        toast.error(errorMessage)
        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 2000)
      }
      return
    }

    if (!ensureStructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 50, message: "Preparing export..." })

      const { blob, filename } = await api.exportDataset(datasetId)
      downloadBlob(blob, filename || `processed_${fileName || "data"}.csv`)

      setProcessingStatus({ status: "completed", progress: 100, message: "File exported successfully!" })

      addLog({
        title: "File Exported",
        date: new Date().toLocaleString(),
        details: `Processed data exported successfully as ${filename || `processed_${fileName || "data"}.csv`}`,
        type: "info",
      })

      toast.success("File exported successfully!")

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed"

      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })

      addLog({
        title: "Export Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })

      toast.error(errorMessage)

      // Reset processing status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 3000)
    }
  }

  const handleSaveProject = async () => {
    if (dataKind === "none") {
      toast.error("No data loaded")
      return
    }

    if (dataKind === "unstructured") {
      if (!ensureUnstructuredData()) return

      try {
        setProcessingStatus({ status: "processing", progress: 50, message: "Saving project..." })

        const isFeatureExtraction = lastTextTransform === "feature-extraction"
        const isTokenization = lastTextTransform === "tokenized" && tokenizationResult
        
        let downloadContent: string
        let downloadName: string
        let mimeType: string

        if (isFeatureExtraction) {
          const featurePayload = featureExtractionResult ?? buildFeatureExtractionFallback(unstructuredData!.text, "tfidf", 1000, 100)
          downloadName = getFeatureExtractionDownloadName()
          downloadContent = JSON.stringify(featurePayload, null, 2)
          mimeType = "application/json;charset=utf-8"
        } else if (isTokenization) {
          downloadName = getUnstructuredDownloadName().replace(/\.txt$/, ".json")
          downloadContent = JSON.stringify(tokenizationResult, null, 2)
          mimeType = "application/json;charset=utf-8"
        } else {
          downloadName = getUnstructuredDownloadName()
          downloadContent = unstructuredData!.text
          mimeType = "text/plain;charset=utf-8"
        }

        const fileBlob = new Blob([downloadContent], { type: mimeType })
        downloadBlob(fileBlob, downloadName)

        setProcessingStatus({ status: "completed", progress: 100, message: "Processed text saved successfully!" })
        addLog({
          title: "Text Saved",
          date: new Date().toLocaleString(),
          details: `${isTokenization ? "Tokenization results" : isFeatureExtraction ? "Feature extraction JSON" : "Processed text"} saved as ${downloadName}`,
          type: "info",
        })
        toast.success(isTokenization ? "Tokenization results saved" : isFeatureExtraction ? "Feature extraction JSON saved" : "Processed text saved")

        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Save failed"
        setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
        toast.error(errorMessage)
        addLog({
          title: "Save Project Error",
          date: new Date().toLocaleString(),
          details: errorMessage,
          type: "error",
        })
        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 2000)
      }
      return
    }

    try {
      let imbalanceArtifact = appliedImbalance
      if (!imbalanceArtifact) {
        try {
          const raw = sessionStorage.getItem(APPLIED_IMBALANCE_STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as AppliedImbalance
            if (parsed?.downloadId) {
              imbalanceArtifact = parsed
              setAppliedImbalance(parsed)
            }
          }
        } catch {
          // ignore storage errors
        }
      }

      if (imbalanceArtifact?.downloadId) {
        setProcessingStatus({ status: "processing", progress: 50, message: "Saving imbalance output CSV..." })
        const { blob, filename } = await api.downloadImbalanceOutput(imbalanceArtifact.downloadId)
        const resolvedName = filename || imbalanceArtifact.outputFile || `imbalance_${imbalanceArtifact.technique}.csv`
        downloadBlob(blob, resolvedName)
        setProcessingStatus({ status: "completed", progress: 100, message: "Imbalance CSV saved successfully!" })
        addLog({
          title: "Project Saved",
          date: new Date().toLocaleString(),
          details: `Saved imbalance output as ${resolvedName}.`,
          type: "info",
        })
        toast.success("Saved imbalance output CSV")
        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 1500)
        return
      }

      let drArtifact = appliedDimensionality
      if (!drArtifact) {
        try {
          const raw = sessionStorage.getItem(APPLIED_DR_STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as AppliedDimensionality
            if (parsed?.downloadId) {
              drArtifact = parsed
              setAppliedDimensionality(parsed)
            }
          }
        } catch {
          // ignore storage errors
        }
      }

      if (drArtifact?.downloadId) {
        setProcessingStatus({ status: "processing", progress: 50, message: "Saving transformed CSV..." })

        const { blob, filename } = await api.downloadDimensionalityReduction(drArtifact.downloadId)
        const resolvedName =
          filename || drArtifact.outputFile || `transformed_${drArtifact.technique}.csv`
        downloadBlob(blob, resolvedName)

        setProcessingStatus({ status: "completed", progress: 100, message: "Transformed CSV saved successfully!" })
        addLog({
          title: "Project Saved",
          date: new Date().toLocaleString(),
          details: `Saved transformed ${drArtifact.technique.toUpperCase()} file as ${resolvedName}.`,
          type: "info",
        })
        toast.success(`Saved ${drArtifact.technique.toUpperCase()} output`)
        setTimeout(() => {
          setProcessingStatus({ status: "idle", progress: 0, message: "" })
        }, 1500)
        return
      }

      if (analysisMode === "pca") {
        toast.error("Run a PCA/SVD/t-SNE/UMAP technique first, then Save Project")
        return
      }
      if (analysisMode === "imbalance") {
        toast.error("Run imbalance handling first, then Save Project")
        return
      }

      const history = datasetId ? await api.getProcessingHistory(datasetId) : { operations: [] }
      const projectPayload = {
        exported_at: new Date().toISOString(),
        dataset_id: datasetId,
        file_name: fileName,
        technique,
        summary: datasetSummary,
        operations: (history as any)?.operations || [],
        logs,
      }

      const blob = new Blob([JSON.stringify(projectPayload, null, 2)], { type: "application/json" })
      downloadBlob(blob, `${(fileName || "project").replace(/\.[^/.]+$/, "")}_project.json`)

      addLog({
        title: "Project Saved",
        date: new Date().toLocaleString(),
        details: "Project metadata and processing history exported as JSON.",
        type: "info",
      })

      toast.success("Project exported successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Save project failed"
      toast.error(errorMessage)
      addLog({
        title: "Save Project Error",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })
    }
  }

  // Refresh preview data when activeTab changes - with debouncing
  useEffect(() => {
    if (datasetId && processingStatus.status === "idle") {
      const timeoutId = setTimeout(() => {
        refreshPreviewData()
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [activeTab, datasetId, processingStatus.status, refreshPreviewData])

  // Handle cancellation
  const handleCancelOperation = () => {
    api.cancelRequest()
    setProcessingStatus({ status: "idle", progress: 0, message: "" })
    toast.info("Operation cancelled")
  }

  // Add new handlers
  const handleAdvancedImputationClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("missing-values-advanced")
    addLog({
      title: "Advanced Missing Values Panel",
      date: new Date().toLocaleString(),
      details: "Opened advanced missing values handling panel.",
      type: "info",
    })
  }

  const handleQuickImputeClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("missing-values-quick")
    addLog({
      title: "Quick Impute Panel",
      date: new Date().toLocaleString(),
      details: "Opened quick missing value imputation panel.",
      type: "info",
    })
  }

  const handleNormalizationClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("normalization")
    addLog({
      title: "Normalization Panel",
      date: new Date().toLocaleString(),
      details: "Opened normalization and encoding panel.",
      type: "info",
    })
  }

  const handleMissingValuesApply = (strategy: string, columns: string[], fillValue?: string) => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.handleMissingValuesAdvanced(datasetId!, strategy, columns, fillValue),
      "Advanced Missing Values Handling",
      `Missing values handled using ${strategy} strategy for ${columns.length} columns`,
    )
  }

  const handleQuickImputeApply = (strategy: string, fillValue?: string) => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.handleMissingValuesAdvanced(datasetId!, strategy, undefined, fillValue),
      "Quick Missing Values Handling",
      `Quick impute completed using ${strategy} strategy`,
    )
  }
  const handleLabelEncodingClick = () => {
    if (!ensureStructuredData()) return
    setAnalysisMode("text-preprocessing-label-encoding");

    addLog({
      title: "Label & Encoding",
      date: new Date().toLocaleString(),
      details: "Opened label and encoding panel for structured data.",
      type: "info",
    });
  };

  const handleNormalizationApply = (method: string, columns: string[]) => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.normalizeDataAdvanced(datasetId!, method, columns),
      "Data Normalization",
      `Data normalized using ${method} method for ${columns.length} columns`,
    )
  }

  const handleEncodingApply = (method: string, columns: string[]) => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.encodeCategoricalAdvanced(datasetId!, method, columns),
      "Categorical Encoding",
      `Categorical variables encoded using ${method} method for ${columns.length} columns`,
    )
  }

  const handleOutliersClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("outliers")
    addLog({
      title: "Outlier Removal Panel",
      date: new Date().toLocaleString(),
      details: "Opened outlier removal panel.",
      type: "info",
    })
  }

  const handleOutlierRemovalApply = (method: "iqr" | "zscore", columns: string[], threshold: number) => {
    if (!ensureStructuredData()) return
    handleProcessingOperation(
      () => api.removeOutliers(datasetId!, method, columns, threshold, false),
      "Outlier Removal",
      `Outliers removed using ${method} method for ${columns.length} columns`,
    )
  }

  const handleDatabaseConnectorsClick = () => {
    setAnalysisMode("database-connectors")
    addLog({
      title: "Database Connectors",
      date: new Date().toLocaleString(),
      details: "Opened database connectors panel.",
      type: "info",
    })
  }

  const handleDatabaseConnectionTest = async (payload: DatabaseConnectorPayload) => {
    try {
      setProcessingStatus({ status: "processing", progress: 40, message: "Testing database connection..." })
      const result = await api.testDatabaseConnection(payload)
      setProcessingStatus({ status: "completed", progress: 100, message: "Database connection successful" })
      addLog({
        title: "Database Connection Test",
        date: new Date().toLocaleString(),
        details: `Connection successful. Query: ${result.query}`,
        type: "info",
      })
      toast.success("Database connection successful")
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1200)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Database connection test failed"
      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
      addLog({
        title: "Database Connection Test Failed",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })
      toast.error(errorMessage)
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2000)
      throw error
    }
  }

  const handlePcaClick = () => {
    if (!ensureStructuredData()) return

    setAnalysisMode("pca")
    addLog({
      title: "PCA / Dimensionality Reduction",
      date: new Date().toLocaleString(),
      details: "Opened PCA tab with dimensionality reduction techniques.",
      type: "info",
    })
  }

  const handleImbalanceClick = () => {
    if (!ensureStructuredData()) return
    setAnalysisMode("imbalance")
    addLog({
      title: "Imbalance Handling",
      date: new Date().toLocaleString(),
      details: "Opened standalone imbalance handling tab.",
      type: "info",
    })
  }

  const handleDimensionalityApplied = (result: DimensionalityReductionResponse) => {
    if (!result?.download_id) return
    const applied = {
      technique: result.technique,
      downloadId: result.download_id,
      outputFile: result.output_file,
    }
    setAppliedDimensionality(applied)
    try {
      sessionStorage.setItem(APPLIED_DR_STORAGE_KEY, JSON.stringify(applied))
    } catch {
      // ignore storage errors
    }
    addLog({
      title: "Dimensionality Reduction Applied",
      date: new Date().toLocaleString(),
      details: `${result.technique.toUpperCase()} applied. Save Project will download ${result.output_file}.`,
      type: "info",
    })
  }

  const handleImbalanceApplied = (result: { technique: string; downloadId: string; outputFile: string }) => {
    const applied = {
      technique: result.technique,
      downloadId: result.downloadId,
      outputFile: result.outputFile,
    }
    setAppliedImbalance(applied)
    try {
      sessionStorage.setItem(APPLIED_IMBALANCE_STORAGE_KEY, JSON.stringify(applied))
    } catch {
      // ignore storage errors
    }
    addLog({
      title: "Imbalance Handling Applied",
      date: new Date().toLocaleString(),
      details: `${result.technique} applied. Save Project will download ${result.outputFile}.`,
      type: "info",
    })
  }

  const handleDatabaseConnectImport = async (payload: DatabaseConnectorPayload) => {
    try {
      setProcessingStatus({ status: "processing", progress: 45, message: "Connecting to database and importing data..." })

      const result = await api.connectDatabaseAndImport(payload)

      setDatasetId(result.dataset_id)
      setFileName(result.filename)
      setTableData(result.sample_data || [])
      setDataKind("structured")
      setUnstructuredData(null)
      setTokenizationBaseText("")
      setSummaryData(null)
      setCorrelationData(null)
      setAppliedDimensionality(null)
      setAppliedImbalance(null)
      try {
        sessionStorage.removeItem(APPLIED_DR_STORAGE_KEY)
        sessionStorage.removeItem(APPLIED_IMBALANCE_STORAGE_KEY)
      } catch {
        // ignore storage errors
      }
      setFeatureExtractionResult(null)
      setTokenizationResult(null)
      setLastTextTransform("processed")
      setActiveTab("Head")
      setLastActiveTab("")

      updateDataFromSummary(result.summary)
      setAnalysisMode("overview")

      setProcessingStatus({ status: "completed", progress: 100, message: "Database data imported successfully" })
      addLog({
        title: "Database Import Successful",
        date: new Date().toLocaleString(),
        details: `Imported dataset ${result.filename} with ${result.summary?.shape?.[0] || 0} rows.`,
        type: "info",
      })
      toast.success("Database import completed. Redirected to Overview.")

      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Database import failed"
      setProcessingStatus({ status: "error", progress: 0, message: errorMessage })
      addLog({
        title: "Database Import Failed",
        date: new Date().toLocaleString(),
        details: errorMessage,
        type: "error",
      })
      toast.error(errorMessage)
      setTimeout(() => {
        setProcessingStatus({ status: "idle", progress: 0, message: "" })
      }, 2500)
      throw error
    }
  }

  // Add handler for refreshing random sample
  const handleRefreshRandomSample = async () => {
    if (!datasetId || activeTab !== "Random Sample") return

    try {
      const response = await fetch(`http://localhost:5000/api/dataset/${datasetId}/refresh-random`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTableData(result.data.data || [])
          toast.success("Random sample refreshed!")

          addLog({
            title: "Random Sample Refreshed",
            date: new Date().toLocaleString(),
            details: `Generated new random sample with ${result.data.sample_size || 0} rows`,
            type: "info",
          })
        }
      }
    } catch (error) {
      console.error("Error refreshing random sample:", error)
      toast.error("Failed to refresh random sample")
    }
  }

  const handleAgentMessage = async (msg: string, agentMode = true): Promise<string> => {
    const datasetType = dataKind === "unstructured" ? "unstructured" : "structured"
    const fallbackSummary =
      dataKind === "unstructured"
        ? {
            file_name: unstructuredData?.fileName || fileName,
            char_count: unstructuredData?.charCount || 0,
            word_count: unstructuredData?.wordCount || 0,
            line_count: unstructuredData?.lineCount || 0,
          }
        : {}

    const summaryPayload = (datasetSummary || summaryData || fallbackSummary || {}) as Record<string, any>
    const agentResponse = await api.chatWithAgent({
      dataset_type: datasetType,
      summary: summaryPayload,
      question: msg || "",
      agent_mode: agentMode ? "yes" : "no",
    })

    const reply = agentResponse?.reply || "No response from agent."
    addLog({
      title: "Agent Response",
      date: new Date().toLocaleString(),
      details: reply.slice(0, 240),
      type: "info",
    })
    return reply
  }

  return (
    <div className="flex flex-col h-screen bg-[#000] text-white overflow-hidden">
      <TopNavbar handleExportFile={handleExportFile} handleSaveProject={handleSaveProject} />
      <div className="flex flex-1 overflow-hidden">
        <div className="h-full w-1/5 shrink-0 border-r border-[#1a1a1a]">
          <LeftSidebar
            handleFileUpload={handleFileUpload}
            handleImputeMissingValues={handleImputeMissingValues}
            onDatabaseConnectorsClick={handleDatabaseConnectorsClick}
            onVisualizationClick={handleVisualizationClick}
            onDataSummaryClick={handleDataSummaryClick}
            onCorrelationAnalysisClick={handleCorrelationAnalysisClick}
            onPcaClick={handlePcaClick}
            onImbalanceClick={handleImbalanceClick}
            onMissingValuesClick={handleAdvancedImputationClick}
            onQuickImputeClick={handleQuickImputeClick}
            onOutliersClick={handleOutliersClick}
            onExportClick={handleExportFile}
            onSaveProjectClick={handleSaveProject}
            onNormalizationClick={handleNormalizationClick}
            onTextNormalizationClick={handleTextNormalizationClick}
            onValidationClick={handleValidationClick}
            onBasicCleaningClick={handleBasicCleaningClick}
            onTokenizationClick={handleTokenizationClick}
            onRemoveStopWordsClick={handleFilteringClick}
            onMinWordLengthClick={handleFilteringClick}
            onFeatureExtractionClick={handleFeatureExtractionClick}
            onLabelEncodingClick={handleLabelEncodingClick}
            onImportTextDataClick={handleImportTextDataClick}
            dataKind={dataKind}
            disabled={processingStatus.status === "processing"}
          />
        </div>

        <div className="min-w-0 h-full w-3/5">
          <ScrollArea className="h-full" viewportClassName="h-full">
            <MainContent
              tableData={tableData}
              dataKind={dataKind}
              unstructuredData={unstructuredData}
              sourceText={analysisMode === "text-preprocessing-tokenization"
                ? (tokenizationBaseText || unstructuredData?.text || "")
                : (unstructuredData?.text || "")}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              technique={technique}
              fileName={fileName}
              datasetId={datasetId}
              analysisMode={analysisMode}
              onBackToOverview={handleBackToOverview}
              summaryData={summaryData}
              datasetSummary={datasetSummary}
              correlationData={correlationData}
              disabled={processingStatus.status === "processing"}
              onQuickImputeApply={handleQuickImputeApply}
              onMissingValuesApply={handleMissingValuesApply}
              onNormalizationApply={handleNormalizationApply}
              onEncodingApply={handleEncodingApply}
              onOutlierRemovalApply={handleOutlierRemovalApply}
              onDatabaseConnectionTest={handleDatabaseConnectionTest}
              onDatabaseConnectImport={handleDatabaseConnectImport}
              onUnstructuredImport={handleUnstructuredImport}
              onBasicCleaningApply={handleBasicCleaningApply}
              onTokenizationApply={handleTokenizationApply}
              onFilteringApply={handleFilteringApply}
              onTextNormalizationApply={handleTextNormalizationApply}
              onFeatureExtractionApply={handleFeatureExtractionApply}
              onDimensionalityApplied={handleDimensionalityApplied}
              onImbalanceApplied={handleImbalanceApplied}
              onRefreshRandomSample={handleRefreshRandomSample}
            />
          </ScrollArea>
        </div>

        <div className="h-full w-1/5 shrink-0 border-l border-[#1a1a1a]">
          <RightSidebar logs={logs} onSendMessage={handleAgentMessage} />
        </div>
      </div>

      <LoadingOverlay
        isVisible={processingStatus.status === "processing"}
        title="Processing Data"
        message={processingStatus.message}
        progress={processingStatus.progress}
        canCancel={true}
        onCancel={handleCancelOperation}
      />
    </div>
  )
}



