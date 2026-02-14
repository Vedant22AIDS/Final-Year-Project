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
import type { CleaningOption } from "../features/text-preprocessing/basic-cleaning.tsx"
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

export function DataPreprocessingApp() {
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [dataKind, setDataKind] = useState<DataKind>("none")
  const [unstructuredData, setUnstructuredData] = useState<UnstructuredDataPayload | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"Head" | "Tail" | "Random Sample">("Head")
  const [technique, setTechnique] = useState({
    column: "No data loaded",
    count: "0",
    missing: "0",
    mean: "0",
    categories: "0",
  })
  const [classImbalance, setClassImbalance] = useState<any>(null);
  const [analysisMode, setAnalysisMode] = useState<
    | "overview"
    | "visualization"
    | "summary"
    | "correlation"
    | "missing-values-advanced"
    | "missing-values-quick"
    | "normalization"
    | "outliers"
    | "class-balancing"
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
    setSummaryData(null)
    setDatasetSummary(null)
    setCorrelationData(null)
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
    setDatasetId(null)
    setTableData([])
    setSummaryData(null)
    setDatasetSummary(null)
    setCorrelationData(null)
    setFileName(payload.fileName || "Unstructured Data")
    setAnalysisMode("overview")

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

      const summaryRaw = await api.getDatasetSummary(datasetId!)
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
const handleCheckClassImbalance = async (target: string) => {
  if (!ensureStructuredData()) return;
  if (!datasetId) {
    toast.error("No dataset loaded");
    return;
  }

  try {
    setProcessingStatus({ status: "processing", progress: 10, message: "Checking class imbalance..." });

    // use the generic api.apiCall (useApi exposes apiCall)
    // endpoint path depends on your backend — adjust `/imbalance` path if needed
    const res = await api.apiCall<any>(`/dataset/${datasetId}/imbalance?target=${encodeURIComponent(target)}`);
    setClassImbalance(res);

    toast.success("Class imbalance stats received");
    setProcessingStatus({ status: "completed", progress: 100, message: "Imbalance check complete" });
    setTimeout(() => setProcessingStatus({ status: "idle", progress: 0, message: "" }), 1200);
  } catch (err) {
    console.error("Imbalance check failed:", err);
    toast.error((err as any)?.message ?? "Imbalance check failed");
    setProcessingStatus({ status: "error", progress: 0, message: "Imbalance check failed" });
    setTimeout(() => setProcessingStatus({ status: "idle", progress: 0, message: "" }), 2000);
  }
};

  const handleCorrelationAnalysisClick = async () => {
    if (!ensureStructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 50, message: "Analyzing correlations..." })

      const correlationRaw = await api.getCorrelationAnalysis(datasetId!)
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

      const result = await api.tokenizeText(unstructuredData!.text, method, nGramSize)
      const tokens = result.tokens || []
      const transformedText = method === "sentence" ? tokens.join("\n") : tokens.join(" ")

      setUnstructuredData({
        text: transformedText,
        fileName: unstructuredData!.fileName,
        charCount: transformedText.length,
        wordCount: tokens.length,
        lineCount: transformedText ? transformedText.split("\n").length : 0,
      })

      setProcessingStatus({ status: "completed", progress: 100, message: "Tokenization applied successfully" })

      addLog({
        title: "Tokenization Applied",
        date: new Date().toLocaleString(),
        details: `Method: ${method}${method === "ngram" ? ` (n=${nGramSize})` : ""}. Generated ${result.token_count} tokens.`,
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

  const handleExportFile = async () => {
    if (!ensureStructuredData()) return

    try {
      setProcessingStatus({ status: "processing", progress: 50, message: "Preparing export..." })

      const { blob, filename } = await api.exportDataset(datasetId!)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || `processed_${fileName || "data"}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

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

    try {
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
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(fileName || "project").replace(/\.[^/.]+$/, "")}_project.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

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
    if (!ensureUnstructuredData()) return
    setAnalysisMode("text-preprocessing-label-encoding");

    addLog({
      title: "Label & Encoding",
      date: new Date().toLocaleString(),
      details: "Opened label and encoding panel.",
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
  const handleClassBalancingClick = () => {
  if (!ensureStructuredData()) return

  setAnalysisMode("class-balancing")

  addLog({
    title: "Class Balancing Panel",
    date: new Date().toLocaleString(),
    details: "Opened class balancing panel.",
    type: "info",
  })
}
type BalancingMethod =
  | "random_over"
  | "random_under"
  | "smote"
  | "smote_tomek"
  | "class_weight"

const handleClassBalancingApply = (
  target: string,
  method: BalancingMethod
) => {
  if (!datasetId) return
  if (!ensureStructuredData()) return

  handleProcessingOperation(
    () => api.applyClassBalancing(datasetId!, target, method),
    "Class Balancing",
    `Class balancing applied using ${method} on target "${target}"`
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

  const handleDatabaseConnectionTest = async (payload: any) => {
    console.log("Database connector test payload:", payload)
    toast.success("Connection test request prepared on frontend")
  }

  const handleDatabaseConnectImport = async (payload: any) => {
    console.log("Database connector import payload:", payload)
    toast.info("Frontend panel implemented. Backend connector API can be wired next.")
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
            onMissingValuesClick={handleAdvancedImputationClick}
            onQuickImputeClick={handleQuickImputeClick}
            onOutliersClick={handleOutliersClick}
            onClassBalancingClick={handleClassBalancingClick}

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
              sourceText={unstructuredData?.text || ""}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              technique={technique}
              fileName={fileName}
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
              onClassBalancingApply={handleClassBalancingApply}
              onDatabaseConnectionTest={handleDatabaseConnectionTest}
              onDatabaseConnectImport={handleDatabaseConnectImport}
              onUnstructuredImport={handleUnstructuredImport}
              onBasicCleaningApply={handleBasicCleaningApply}
              onTokenizationApply={handleTokenizationApply}
              onRefreshRandomSample={handleRefreshRandomSample}
              classImbalance={classImbalance}
              onCheckClassImbalance={handleCheckClassImbalance}

            />
          </ScrollArea>
        </div>

        <div className="h-full w-1/5 shrink-0 border-l border-[#1a1a1a]">
          <RightSidebar logs={logs} />
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



