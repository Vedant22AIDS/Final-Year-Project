"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "./Data-table.tsx";
import { Button } from "../components/ui/button.tsx";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip.tsx";
import { BarChart } from "../components/ui/charts.tsx";
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronRight,
  FileText,
  Filter,
  LineChartIcon,
  List,
  PieChartIcon,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Table,
  ArrowLeft,
} from "lucide-react";
import { VisualizationPanel } from "../features/visualization-panel.tsx";
import { AdvancedCharts } from "../features/advanced-charts.tsx";
import { DataSummaryView } from "../features/data-summary-view.tsx";
import { CorrelationAnalysisView } from "../features/correlation-analysis-view.tsx";
import { MissingValuesPanel } from "../features/missing-values-panel.tsx";
import { NormalizationPanel } from "../features/normalization-panel.tsx";

interface VisualizationConfig {
  type: string;
  analysisType: "univariate" | "bivariate" | "multivariate";
  features: string[];
}

// ...existing code...
export interface MainContentProps {
  tableData: any[]
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
  analysisMode: "overview" | "visualization" | "summary" | "correlation" | "missing-values" | "normalization"
  onBackToOverview: () => void
  summaryData: any
  correlationData: any
  disabled: boolean
  onMissingValuesApply: (strategy: string, columns: string[], fillValue?: string) => void
  onNormalizationApply: (method: string, columns: string[]) => void
  onEncodingApply: (method: string, columns: string[]) => void
  onRefreshRandomSample: () => Promise<void>
}
// ...existing code...

export function MainContent({
  tableData,
  activeTab,
  setActiveTab,
  fileName,
  analysisMode = "overview",
  onBackToOverview,
  summaryData,
  correlationData,
  disabled,
  onMissingValuesApply,
  onNormalizationApply,
  onEncodingApply,
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

  if (analysisMode === "missing-values") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <MissingValuesPanel data={tableData} onBack={onBackToOverview || (() => {})} onApply={onMissingValuesApply || (() => {})} disabled={disabled} />
      </div>
    );
  }

  if (analysisMode === "normalization") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#000] p-4">
        <NormalizationPanel data={tableData} onBack={onBackToOverview || (() => {})} onNormalize={onNormalizationApply || (() => {})} onEncode={onEncodingApply || (() => {})} disabled={disabled} />
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

  // overview UI
  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4 space-y-6">
      {/* Data Preview */}
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-md overflow-hidden">
        <div className="p-4 pb-3 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Table className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-medium">Data Preview</h3>
              {fileName && <Badge variant="outline" className="ml-2 text-xs">{fileName}</Badge>}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data..."
                  className="h-9 w-64 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 bg-[#1a1a1a] border-[#2a2a2a]">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Filter Data</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 bg-[#1a1a1a] border-[#2a2a2a]">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="bg-[#252525] rounded p-1">
              <div className="flex space-x-1">
                {(["Head", "Tail", "Random Sample"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs rounded-sm transition-colors ${activeTab === tab ? "bg-[#3b3b3b] text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {searchQuery ? (
                <span>Filtered: {displayData.length} of {tableData.length} rows</span>
              ) : (
                <span>Showing {displayData.length} of {tableData.length} rows</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <DataTable data={displayData} fileName={fileName} />
        </div>
      </div>

      {/* Data Quality Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Data Quality Score */}
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-400" />
                Data Quality Score
              </div>
              <Badge className={`${getQualityColor(dataQuality.score)} bg-opacity-20`}>
                {dataQuality.score >= 90 ? "Excellent" : dataQuality.score >= 80 ? "Good" : dataQuality.score >= 60 ? "Fair" : dataQuality.score >= 40 ? "Poor" : "Critical"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="transparent" stroke="#2a2a2a" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={dataQuality.score >= 80 ? "#22c55e" : dataQuality.score >= 60 ? "#eab308" : "#ef4444"}
                    strokeWidth="8"
                    strokeDasharray={`${dataQuality.score * 2.83} ${283 - dataQuality.score * 2.83}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getQualityColor(dataQuality.score)}`}>{dataQuality.score}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {dataQuality.issues.slice(0, 3).map((issue, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center flex-1">
                    <Badge className={`mr-2 text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                    <span className="truncate">{issue.type}</span>
                  </div>
                  <span className="text-gray-400 text-xs ml-2">{issue.count}</span>
                </div>
              ))}
              {dataQuality.issues.length > 3 && <div className="text-sm text-gray-400 text-center pt-1 border-t border-[#2a2a2a]">+{dataQuality.issues.length - 3} more issues</div>}
              {dataQuality.issues.length === 0 && (
                <div className="text-sm text-green-400 text-center py-2 flex items-center justify-center">
                  <Check className="h-4 w-4 mr-1" />
                  No quality issues detected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Dataset Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Total Rows</div>
                <div className="text-xl font-semibold">{quickStats.rowCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Data points</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Total Columns</div>
                <div className="text-xl font-semibold">{quickStats.columnCount}</div>
                <div className="text-xs text-gray-500">Features</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Data Completeness</div>
                <div className="text-xl font-semibold text-blue-400">{quickStats.completeness}%</div>
                <div className="text-xs text-gray-500">{quickStats.missingValues.toLocaleString()} missing</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Data Uniqueness</div>
                <div className="text-xl font-semibold text-purple-400">
                  {quickStats.duplicateRows === 0 ? "100%" : `${(((quickStats.rowCount - quickStats.duplicateRows) / Math.max(quickStats.rowCount, 1)) * 100).toFixed(1)}%`}
                </div>
                <div className="text-xs text-gray-500">{quickStats.duplicateRows} duplicates</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2a2a2a]">
              <div className="text-sm text-gray-400 mb-3">Column Distribution</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Numerical</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{quickStats.numericColumns}</span>
                    <span className="text-xs text-gray-400">({quickStats.columnCount ? ((quickStats.numericColumns / quickStats.columnCount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm">Date/Time</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{quickStats.dateColumns}</span>
                    <span className="text-xs text-gray-400">({quickStats.columnCount ? ((quickStats.dateColumns / quickStats.columnCount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2a2a2a] text-center">
              <div className="text-xs text-gray-400">Memory Usage: {quickStats.memoryUsage}</div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="flex items-start space-x-2 text-sm">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
              {recommendations.length === 0 && <div className="text-sm text-gray-400 text-center py-2">No recommendations at this time</div>}
            </div>

            <div className="mt-4 pt-2 flex justify-center">
              <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#2a2a2a] text-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Auto-Fix Issues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Insights & Anomalies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#121212] border-[#2a2a2a] md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <List className="h-5 w-5 mr-2 text-blue-400" />
                Column Insights
              </div>
              <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#2a2a2a] text-xs">
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto pr-2">
            <div className="space-y-3">
              {columnInsights.slice(0, 6).map((col: any, i: number) => (
                <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{col.name}</span>
                      <Badge className={getTypeColor(col.type)}>{col.type}</Badge>
                    </div>
                    {col.nullCount > 0 && <span className="text-xs text-red-400">{col.nullPercentage.toFixed(1)}% missing</span>}
                  </div>

                  {col.nullCount > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Completeness</span>
                        <span>{(100 - col.nullPercentage).toFixed(1)}%</span>
                      </div>
                      <Progress value={100 - col.nullPercentage} className="h-1.5" />
                    </div>
                  )}

                  <div className="text-xs text-gray-400 space-y-1">
                    {col.insights.map((insight: string, j: number) => (
                      <div key={j}>{insight}</div>
                    ))}
                  </div>
                </div>
              ))}

              {columnInsights.length > 6 && <div className="text-center text-sm text-gray-400 py-2">+{columnInsights.length - 6} more columns</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              Potential Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anomaly, i) => (
                  <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="font-medium text-sm mb-1">{anomaly.column}</div>
                    <div className="text-xs text-yellow-400 mb-1">{anomaly.issue}</div>
                    <div className="text-xs text-gray-400">{anomaly.recommendation}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Check className="h-10 w-10 text-green-400 mb-2" />
                <div className="text-sm font-medium">No anomalies detected</div>
                <div className="text-xs text-gray-400 mt-1">Your data looks clean</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Distribution Preview */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Data Distribution Preview
            </div>
            <Tabs defaultValue="bar" className="h-8">
              <TabsList className="bg-[#1a1a1a] h-8">
                <TabsTrigger value="bar" className="h-7 text-xs data-[state=active]:bg-[#3b3b3b]">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line" className="h-7 text-xs data-[state=active]:bg-[#3b3b3b]">
                  <LineChartIcon className="h-3.5 w-3.5 mr-1.5" />
                  Line
                </TabsTrigger>
                <TabsTrigger value="pie" className="h-7 text-xs data-[state=active]:bg-[#3b3b3b]">
                  <PieChartIcon className="h-3.5 w-3.5 mr-1.5" />
                  Pie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnInsights.filter((c) => c.type === "numeric").slice(0, 3).map((col: any, i: number) => (
              <div key={i} className="h-48">
                <div className="text-sm font-medium mb-1">{col.name}</div>
                <div className="h-40 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-2">
                  <BarChart data={[
                    { name: "Category 1", value: 40 },
                    { name: "Category 2", value: 30 },
                    { name: "Category 3", value: 20 },
                    { name: "Category 4", value: 10 },
                  ]} />
                </div>
              </div>
            ))}

            {columnInsights.filter((c) => c.type === "numeric").length === 0 && (
              <div className="col-span-3 flex items-center justify-center h-48 text-gray-400">No numeric columns available for visualization</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
