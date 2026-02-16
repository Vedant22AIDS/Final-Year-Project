"use client";
import BasicCleaning, { type CleaningOption } from "../features/text-preprocessing/basic-cleaning.tsx";
import DataOverview from "../features/DataOverview.tsx";

import React, { useEffect, useMemo, useState } from "react";
import ValidationDashboard from "../features/validation/validation-dashboard.tsx";

import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { ArrowLeft } from "lucide-react";
import { VisualizationPanel } from "../features/visualization-panel.tsx";
import { AdvancedCharts } from "../features/advanced-charts.tsx";
import { DataSummaryView } from "../features/data-summary-view.tsx";
import { CorrelationAnalysisView } from "../features/correlation-analysis-view.tsx";
import { MissingValuesPanel } from "../features/missing-values-panel.tsx";
import { NormalizationPanel } from "../features/normalization-panel.tsx";
import { QuickImputePanel } from "../features/quick-impute-panel.tsx";
import { OutlierRemovalPanel } from "../features/outlier-removal-panel.tsx";
import { DatabaseConnectorsPanel } from "../features/database-connectors-panel.tsx";
import FilteringPanel from "../features/text-preprocessing/filtering-panel.tsx";
import TextNormalizationPanel from "../features/text-preprocessing/normalization-panel.tsx";
import FeatureExtraction from "../features/text-preprocessing/feature-extraction.tsx";
import LabelEncodingPanel from "../features/text-preprocessing/label-encoding.tsx";
import ImportTextData from "../features/text-preprocessing/import-data.tsx";
//Himanshi's contribution for class imbalance analysis and balancing
import { ClassBalancingPanel } from "../features/class-balancing-panel.tsx";
import type { BalancingMethod } from "../features/class-balancing-panel.tsx";
interface VisualizationConfig {
  type: string;
  analysisType: "univariate" | "bivariate" | "multivariate";
  features: string[];
}

type TokenizationApplyConfig = {
  method: "word" | "sentence" | "ngram";
  nGramSize: number;
};

const buildTokenPreview = (text: string, method: "word" | "sentence" | "ngram", ngram: number): string[] => {
  if (!text.trim()) return [];

  const words = text.match(/\b\w+(?:'\w+)?\b/g) || [];

  if (method === "word") {
    return words.slice(0, 12);
  }

  if (method === "sentence") {
    return text
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (words.length < ngram) return [];

  return Array.from({ length: words.length - ngram + 1 }, (_, idx) =>
    words.slice(idx, idx + ngram).join(" "),
  ).slice(0, 12);
};

// ...existing code...
export interface MainContentProps {
  tableData: any[]
  dataKind: "none" | "structured" | "unstructured"
  sourceText: string
  unstructuredData: {
    text: string
    fileName: string
    charCount: number
    wordCount: number
    lineCount: number
  } | null
  activeTab: "Head" | "Tail" | "Random Sample"
  setActiveTab: React.Dispatch<React.SetStateAction<"Head" | "Tail" | "Random Sample">>
  technique: {
    column: string
    count: string
    missing: string
    mean: string
    categories: string
  }
  fileName: string
  analysisMode:
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
  | "text-preprocessing-normalization"
  | "text-preprocessing-feature-extraction"
  | "text-preprocessing-label-encoding"
  | "text-preprocessing-import-data"
  //"class-balancing"
  
  onBackToOverview: () => void
  summaryData: any
  datasetSummary: any
  correlationData: any
  disabled: boolean


  onQuickImputeApply: (strategy: string, fillValue?: string) => void
  onMissingValuesApply: (strategy: string, columns: string[], fillValue?: string) => void
  onNormalizationApply: (method: string, columns: string[]) => void
  onEncodingApply: (method: string, columns: string[]) => void
  onOutlierRemovalApply: (method: "iqr" | "zscore", columns: string[], threshold: number) => void
  onClassBalancingApply: (target: string,method: BalancingMethod) => void
  onDatabaseConnectionTest: (payload: any) => Promise<void> | void
  onDatabaseConnectImport: (payload: any) => Promise<void> | void
  onUnstructuredImport: (payload: { text: string; fileName: string; charCount: number; wordCount: number; lineCount: number }) => void
  onBasicCleaningApply: (options: CleaningOption[]) => Promise<{ cleanedText: string } | void> | void
  onTokenizationApply: (config: TokenizationApplyConfig) => Promise<{ token_count: number; tokens: string[] } | void> | void
  onRefreshRandomSample: () => Promise<void>
  classImbalance?: any;
  onCheckClassImbalance: (target: string) => void;
}
// ...existing code...

export function MainContent({
  tableData,
  dataKind,
  sourceText,
  unstructuredData,
  activeTab,
  setActiveTab,
  technique,
  fileName,
  analysisMode = "overview",
  onBackToOverview,
  summaryData,
  datasetSummary,
  correlationData,
  disabled,
  onQuickImputeApply,
  onMissingValuesApply,
  onNormalizationApply,
  onEncodingApply,
  onOutlierRemovalApply,
  onClassBalancingApply,
  onDatabaseConnectionTest,
  onDatabaseConnectImport,
  onUnstructuredImport,
  onBasicCleaningApply,
  onTokenizationApply,
  onRefreshRandomSample,
    classImbalance,
  onCheckClassImbalance,

}: MainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dataQuality, setDataQuality] = useState<{
    score: number;
    issues: { type: string; count: number; severity: "low" | "medium" | "high"; description?: string }[];
  }>({ score: 0, issues: [] });

  const [quickStats, setQuickStats] = useState<{
    rowCount: number;
    columnCount: number;
    missingValues: number;
    missingPercentage: number;
    duplicateRows: number;
    numericColumns: number;
    categoricalColumns: number;
    dateColumns: number;
    memoryUsage: string;
    dataQualityGrade: string;
    completeness: string;
  }>({
    rowCount: 0,
    columnCount: 0,
    missingValues: 0,
    missingPercentage: 0,
    duplicateRows: 0,
    numericColumns: 0,
    categoricalColumns: 0,
    dateColumns: 0,
    memoryUsage: "0 KB",
    dataQualityGrade: "Unknown",
    completeness: "0",
  });

  const [columnInsights, setColumnInsights] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationConfig | null>(null);
  // 🔹 Tokenization state (MUST be here – top level)
  const [tokenizationMethod, setTokenizationMethod] = useState<
    "word" | "sentence" | "ngram"
  >("word");

  const [ngramSize, setNgramSize] = useState(2);

  // derive the rows to show based on active tab and search query
  const displayData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    let filtered = tableData;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = tableData.filter((row) =>
        Object.values(row).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
      );
    }

    if (activeTab === "Head") return filtered.slice(0, 5);
    if (activeTab === "Tail") return filtered.slice(-5);
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [tableData, activeTab, searchQuery]);

  // compute stats & quality whenever data changes
  useEffect(() => {
    if (!tableData || tableData.length === 0) {
      setColumnInsights([]);
      setQuickStats((s) => ({ ...s, rowCount: 0, columnCount: 0 }));
      setDataQuality({ score: 0, issues: [] });
      setRecommendations([]);
      setAnomalies([]);
      return;
    }

    const calculateDataStats = (data: any[]) => {
      const columns = Object.keys(data[0] || {});
      let missingCount = 0;
      let numericCount = 0;
      let categoricalCount = 0;
      let dateCount = 0;

      // duplicates
      const stringifiedRows = data.map((r) => JSON.stringify(r));
      const uniqueRows = new Set(stringifiedRows);
      const duplicateRows = data.length - uniqueRows.size;

      const columnStats = columns.map((col) => {
        const values = data.map((r) => r[col]);
        const nonNull = values.filter((v) => v !== null && v !== undefined);
        const nullCount = values.length - nonNull.length;
        missingCount += nullCount;

        let type = "unknown";
        const insights: string[] = [];

        if (nonNull.length > 0) {
          const numericValues = nonNull.filter((v) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v))));
          const dateValues = nonNull.filter((v) => typeof v === "string" && !isNaN(Date.parse(v)));

          if (numericValues.length === nonNull.length) {
            type = "numeric";
            numericCount++;
            const numbers = numericValues.map((v) => Number(v));
            const min = Math.min(...numbers);
            const max = Math.max(...numbers);
            const mean = numbers.reduce((s, n) => s + n, 0) / numbers.length;
            const sorted = [...numbers].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1 || 0;
            const outlierCount = numbers.filter((n) => (iqr ? n < q1 - 1.5 * iqr || n > q3 + 1.5 * iqr : false)).length;

            insights.push(`Range: ${min.toFixed(2)} to ${max.toFixed(2)}`);
            insights.push(`Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)}`);
            if (outlierCount > 0) insights.push(`${outlierCount} potential outliers detected`);
          } else if (dateValues.length > nonNull.length * 0.7) {
            type = "date";
            dateCount++;
            const dates = dateValues.map((v) => new Date(v));
            const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
            insights.push(`Range: ${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`);
            insights.push(`Timespan: ${Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))} days`);
          } else {
            type = "categorical";
            categoricalCount++;
            const uniqueValues = new Set(nonNull.map((v) => String(v)));
            const counts = nonNull.reduce((acc: Record<string, number>, v: any) => {
              const k = String(v);
              acc[k] = (acc[k] || 0) + 1;
              return acc;
            }, {});
            const topValues = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([val, c]) => `${val} (${c})`);
            insights.push(`${uniqueValues.size} unique values`);
            if (topValues.length) insights.push(`Most common: ${topValues.join(", ")}`);
          }
        }

        return {
          name: col,
          type,
          nullCount,
          nullPercentage: values.length > 0 ? (nullCount / values.length) * 100 : 0,
          uniqueCount: new Set(nonNull.map((v) => String(v))).size,
          insights,
        };
      });

      const totalCells = data.length * columns.length;
      const missingPercentage = totalCells > 0 ? (missingCount / totalCells) * 100 : 0;
      const duplicatePercentage = data.length > 0 ? (duplicateRows / data.length) * 100 : 0;

      const missingPenalty = Math.min(40, missingPercentage * 0.8);
      const duplicatePenalty = Math.min(25, duplicatePercentage * 1.2);
      const constantColumns = columnStats.filter((c) => c.uniqueCount <= 1).length;
      const constantPenalty = Math.min(15, (constantColumns / Math.max(columns.length, 1)) * 100 * 0.3);
      const highCardinalityColumns = columnStats.filter((c) => c.type === "categorical" && c.uniqueCount > data.length * 0.8).length;
      const cardinalityPenalty = Math.min(10, (highCardinalityColumns / Math.max(columns.length, 1)) * 100 * 0.2);
      const outlierColumns = columnStats.filter((c) => c.insights.some((ins: string) => ins.includes("outliers"))).length;
      const outlierPenalty = Math.min(10, (outlierColumns / Math.max(columns.length, 1)) * 100 * 0.2);

      const qualityScore = Math.max(0, Math.min(100, 100 - missingPenalty - duplicatePenalty - constantPenalty - cardinalityPenalty - outlierPenalty));

      const issues: { type: string; count: number; severity: "low" | "medium" | "high"; description?: string }[] = [];

      if (missingCount > 0) {
        const severity = missingPercentage > 30 ? "high" : missingPercentage > 10 ? "medium" : "low";
        issues.push({ type: "Missing Values", count: missingCount, severity, description: `${missingPercentage.toFixed(1)}% of data is missing` });
      }

      if (duplicateRows > 0) {
        const severity = duplicatePercentage > 20 ? "high" : duplicatePercentage > 5 ? "medium" : "low";
        issues.push({ type: "Duplicate Rows", count: duplicateRows, severity, description: `${duplicatePercentage.toFixed(1)}% of rows are duplicates` });
      }

      if (constantColumns > 0) {
        issues.push({
          type: "Constant Columns",
          count: constantColumns,
          severity: constantColumns > columns.length * 0.2 ? "high" : "medium",
          description: `${constantColumns} column(s) have no variation`,
        });
      }

      if (highCardinalityColumns > 0) {
        issues.push({ type: "High Cardinality", count: highCardinalityColumns, severity: "medium", description: `${highCardinalityColumns} categorical column(s) have too many unique values` });
      }

      if (outlierColumns > 0) {
        issues.push({ type: "Potential Outliers", count: outlierColumns, severity: "low", description: `${outlierColumns} numerical column(s) contain potential outliers` });
      }

      const criticalNullColumns = columnStats.filter((c) => c.nullPercentage > 70);
      criticalNullColumns.forEach((col) => {
        issues.push({ type: `Critical Missing Data`, count: col.nullCount, severity: "high", description: `Column "${col.name}" is ${col.nullPercentage.toFixed(1)}% missing` });
      });

      const memoryUsageKB = JSON.stringify(data).length / 1024;
      const dataQualityGrade =
        qualityScore >= 90 ? "Excellent" : qualityScore >= 80 ? "Good" : qualityScore >= 60 ? "Fair" : qualityScore >= 40 ? "Poor" : "Critical";

      return {
        columnStats,
        missingCount,
        numericCount,
        categoricalCount,
        dateCount,
        duplicateRows,
        qualityScore,
        issues,
        quickStats: {
          rowCount: data.length,
          columnCount: columns.length,
          missingValues: missingCount,
          missingPercentage,
          duplicateRows,
          numericColumns: numericCount,
          categoricalColumns: categoricalCount,
          dateColumns: dateCount,
          memoryUsage: `${memoryUsageKB.toFixed(2)} KB`,
          dataQualityGrade,
          completeness: totalCells > 0 ? (((totalCells - missingCount) / totalCells) * 100).toFixed(1) : "0",
        },
      };
    };

    const { columnStats, missingCount, duplicateRows, qualityScore, issues, quickStats } = calculateDataStats(tableData);

    setColumnInsights(columnStats);
    setQuickStats(quickStats);
    setDataQuality({ score: Math.round(qualityScore), issues });

    const newRecommendations: string[] = [];
    if (missingCount > 0) newRecommendations.push("Impute missing values to improve data quality");
    if (duplicateRows > 0) newRecommendations.push("Remove duplicate rows to prevent bias in analysis");
    if (columnStats.some((col: any) => col.nullPercentage > 80)) newRecommendations.push("Consider dropping columns with >80% missing values");
    if (quickStats.numericColumns > 0) newRecommendations.push("Normalize numeric features for better model performance");
    if (quickStats.categoricalColumns > 0) newRecommendations.push("Encode categorical variables for machine learning");

    setRecommendations(newRecommendations);

    // Detect anomalies (simple heuristics)
    const potentialAnomalies: any[] = [];
    columnStats.forEach((col: any) => {
      if (col.type === "numeric" && col.insights.some((i: string) => i.includes("outliers"))) {
        potentialAnomalies.push({ column: col.name, issue: "Potential outliers detected", recommendation: "Consider scaling or capping outlier values" });
      }
      if (col.type === "unknown") {
        potentialAnomalies.push({ column: col.name, issue: "Mixed or inconsistent data types", recommendation: "Clean and standardize values in this column" });
      }
    });

    setAnomalies(potentialAnomalies);
  }, [tableData]);

  const handleVisualizationGenerate = (config: VisualizationConfig) => {
    setCurrentVisualization(config);
  };

  // Mode handlers (render different full-screen UIs)
  if (analysisMode === "visualization") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <div className="mb-6">
          <Button variant="outline" onClick={onBackToOverview} className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <h2 className="text-2xl font-bold mb-2">Advanced Data Visualization</h2>
          <p className="text-gray-400">Explore your data with intelligent visualization recommendations.</p>
        </div>

        {currentVisualization ? (
          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {currentVisualization.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} -{" "}
                  {currentVisualization.analysisType.charAt(0).toUpperCase() + currentVisualization.analysisType.slice(1)} Analysis
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentVisualization(null)} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
                  New Visualization
                </Button>
              </CardTitle>
              <div className="text-sm text-gray-400">Features: {currentVisualization.features.join(", ")}</div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <AdvancedCharts data={tableData} config={currentVisualization} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <VisualizationPanel data={tableData} onVisualizationGenerate={handleVisualizationGenerate} />
        )}
      </div>
    );
  }

  if (analysisMode === "summary") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <div className="mb-6">
          <Button variant="outline" onClick={onBackToOverview} className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <h2 className="text-2xl font-bold mb-2">Data Summary</h2>
          <p className="text-gray-400">Comprehensive statistical analysis of your dataset.</p>
        </div>
        <DataSummaryView data={summaryData} />
      </div>
    );
  }
  if (analysisMode === "text-preprocessing-basic-cleaning") {
    return (
      <BasicCleaning
        onBack={onBackToOverview}
        sourceText={unstructuredData?.text || ""}
        onApply={onBasicCleaningApply}
        disabled={disabled}
      />
    );
  }


  if (analysisMode === "text-preprocessing-tokenization") {
    const previewTokens = buildTokenPreview(sourceText || "", tokenizationMethod, ngramSize);

    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <Button
          variant="outline"
          onClick={onBackToOverview}
          className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h2 className="text-2xl font-bold mb-1">Tokenization</h2>
        <p className="text-gray-400 mb-6">
          Split text into meaningful units for NLP processing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { key: "word", label: "Word Tokenization", desc: "Split text into individual words" },
            { key: "sentence", label: "Sentence Tokenization", desc: "Split text into sentences" },
            { key: "ngram", label: "N-gram Generation", desc: "Create sequences of N words" },
          ].map((item) => (
            <Card
              key={item.key}
              onClick={() => setTokenizationMethod(item.key as any)}
              className={`cursor-pointer border transition ${tokenizationMethod === item.key
                ? "border-blue-500 bg-[#111]"
                : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#151515]"
                }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400">
                {item.desc}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-[#111] border-[#2a2a2a] mb-6">
          <CardHeader>
            <CardTitle className="text-sm">N-gram Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <label className="text-sm text-gray-400">N-gram size</label>
            <input
              type="number"
              min={2}
              max={5}
              disabled={tokenizationMethod !== "ngram"}
              value={ngramSize}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (Number.isNaN(parsed)) return;
                setNgramSize(Math.max(2, Math.min(5, parsed)));
              }}
              className={`w-20 px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-sm ${tokenizationMethod !== "ngram" ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#2a2a2a] mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-400">
            {previewTokens.length > 0 ? (
              <>Example -&gt; <code>[{previewTokens.map((token) => `"${token}"`).join(", ")}]</code></>
            ) : (
              <>No text available for preview.</>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-[#2a2a2a]"
            disabled={disabled}
            onClick={() => {
              setTokenizationMethod("word");
              setNgramSize(2);
            }}
          >
            Reset
          </Button>

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            disabled={disabled || !sourceText.trim()}
            onClick={() => {
              onTokenizationApply({
                method: tokenizationMethod,
                nGramSize: ngramSize,
              });
            }}
          >
            Apply Tokenization
          </Button>
        </div>
      </div>
    );
  }
if (analysisMode === "text-preprocessing-filtering") {
    return (
      <FilteringPanel
        onBack={onBackToOverview}
        disabled={disabled}
        onApply={(config) => {
          console.log("Filtering config:", config);
        }}
      />
    );
  }

  if (analysisMode === "text-preprocessing-feature-extraction") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <FeatureExtraction />
      </div>
    );
  }

  if (analysisMode === "text-preprocessing-normalization") {
    return (
      <TextNormalizationPanel
        onBack={onBackToOverview}
        disabled={disabled}
        onApply={(config) => {
          console.log("Normalization config:", config);
        }}
      />
    );
  }

  if (analysisMode === "text-preprocessing-label-encoding") {
    return (
      <LabelEncodingPanel
        onBack={onBackToOverview}
        disabled={disabled}
      />
    );
  }
  if (analysisMode === "text-preprocessing-import-data") {
    return <ImportTextData onBack={onBackToOverview} onImport={onUnstructuredImport} disabled={disabled} />;
  }


  if (analysisMode === "correlation") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <div className="mb-6">
          <Button variant="outline" onClick={onBackToOverview} className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <h2 className="text-2xl font-bold mb-2">Correlation Analysis</h2>
          <p className="text-gray-400">Analyze relationships between numerical variables in your dataset.</p>
        </div>
        <CorrelationAnalysisView data={correlationData} />
      </div>
    );
  }

  if (analysisMode === "missing-values-quick") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <QuickImputePanel
          onBack={onBackToOverview || (() => { })}
          onApply={onQuickImputeApply || (() => { })}
          disabled={disabled}
        />
      </div>
    );
  }

  if (analysisMode === "missing-values-advanced") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <MissingValuesPanel
          data={tableData}
          missingStats={datasetSummary?.missing_values || {}}
          dtypes={datasetSummary?.dtypes || {}}
          totalRows={datasetSummary?.shape?.[0] || 0}
          onBack={onBackToOverview || (() => { })}
          onApply={onMissingValuesApply || (() => { })}
          disabled={disabled}
        />
      </div>
    );
  }

  if (analysisMode === "database-connectors") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <DatabaseConnectorsPanel
          onBack={onBackToOverview}
          onTestConnection={onDatabaseConnectionTest}
          onConnectAndImport={onDatabaseConnectImport}
          disabled={disabled}
        />
      </div>
    );
  }

  if (analysisMode === "outliers") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <OutlierRemovalPanel
          data={tableData}
          dtypes={datasetSummary?.dtypes || {}}
          onBack={onBackToOverview}
          onApply={onOutlierRemovalApply}
          disabled={disabled}
        />
      </div>
    );
  }
  if (analysisMode === "class-balancing") {
  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
      <Button
        variant="outline"
        onClick={onBackToOverview}
        className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Overview
      </Button>

      <ClassBalancingPanel
        onBack={onBackToOverview}
        onApply={onClassBalancingApply}
        onCheckImbalance={onCheckClassImbalance}   // forward handler
        classImbalance={classImbalance}    
        //onCheckImbalance={handleCheckImbalance}
        columns={datasetSummary?.columns || []}
        
      />
    </div>
  );
}


  if (analysisMode === "validation") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <Button
          variant="outline"
          onClick={onBackToOverview}
          className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>

        <ValidationDashboard
          data={tableData}
          onBack={onBackToOverview}
        />
      </div>
    );
  }

  if (analysisMode === "normalization") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <NormalizationPanel data={tableData} onBack={onBackToOverview || (() => { })} onNormalize={onNormalizationApply || (() => { })} onEncode={onEncodingApply || (() => { })} disabled={disabled} />
      </div>
    );
  }

  // helpers for coloring
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "numeric":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "categorical":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "date":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // remove the long overview JSX and replace with:
  return (
    <DataOverview
      tableData={tableData}
      dataKind={dataKind}
      unstructuredData={unstructuredData}
      displayData={displayData}
      fileName={fileName}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      quickStats={quickStats}
      dataQuality={dataQuality}
      columnInsights={columnInsights}
      recommendations={recommendations}
      anomalies={anomalies}
      onRefreshRandomSample={onRefreshRandomSample}
    />
  );

}

