"use client";

import React from "react";
import { DataTable } from "../main-screen/Data-table.tsx";
import { Button } from "../components/ui/button.tsx";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip.tsx";
import { BarChart } from "../components/ui/charts.tsx";
import { BarChart3, Check, ChevronRight, FileText, Filter, LineChartIcon, List, PieChartIcon, RefreshCw, Search, Settings, Table } from "lucide-react";

export interface DataOverviewProps {
    tableData: any[];
    dataKind: "none" | "structured" | "unstructured";
    unstructuredData: {
        text: string;
        fileName: string;
        charCount: number;
        wordCount: number;
        lineCount: number;
    } | null;
    displayData: any[];
    fileName: string;
    activeTab: "Head" | "Tail" | "Random Sample";
    setActiveTab: React.Dispatch<React.SetStateAction<"Head" | "Tail" | "Random Sample">>;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    quickStats: {
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
    };
    dataQuality: {
        score: number;
        issues: { type: string; count: number; severity: "low" | "medium" | "high"; description?: string }[];
    };
    columnInsights: any[];
    recommendations: string[];
    anomalies: any[];
    onRefreshRandomSample?: () => Promise<void> | void;
}

export default function DataOverview({
    tableData,
    dataKind,
    unstructuredData,
    displayData,
    fileName,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    quickStats,
    dataQuality,
    columnInsights,
    recommendations,
    anomalies,
    onRefreshRandomSample,
}: DataOverviewProps) {
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

    const isUnstructured = dataKind === "unstructured" && !!unstructuredData;
    const previewLines = (unstructuredData?.text || "")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .filter((line) => !searchQuery.trim() || line.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 20);

    return (
        <div className="flex-1 overflow-y-auto bg-[#000] p-4 space-y-6">
            {/* Data Preview */}
            <div className="bg-[#121212] border border-[#2a2a2a] rounded-md overflow-hidden">
                <div className="p-4 pb-3 border-b border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <Table className="h-5 w-5 text-blue-400" />
                            <h3 className="text-base font-medium">
                                {isUnstructured ? "Unstructured Text Preview" : "Data Preview"}
                            </h3>
                            {(isUnstructured ? unstructuredData?.fileName : fileName) && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                    {isUnstructured ? unstructuredData?.fileName : fileName}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={isUnstructured ? "Search text..." : "Search data..."}
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

                    {isUnstructured ? (
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Preview lines: {previewLines.length}</span>
                            <span>{unstructuredData?.wordCount || 0} words</span>
                        </div>
                    ) : (
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
                    )}
                </div>

                <div className="p-4">
                    {isUnstructured ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                                <div className="text-xs text-gray-400">Characters</div>
                                <div className="text-xl font-semibold text-blue-400">{unstructuredData?.charCount || 0}</div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                                <div className="text-xs text-gray-400">Words</div>
                                <div className="text-xl font-semibold text-emerald-400">{unstructuredData?.wordCount || 0}</div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                                <div className="text-xs text-gray-400">Lines</div>
                                <div className="text-xl font-semibold text-purple-400">{unstructuredData?.lineCount || 0}</div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                                <div className="text-xs text-gray-400">Tokens (est.)</div>
                                <div className="text-xl font-semibold text-amber-400">{Math.max(0, Math.round((unstructuredData?.wordCount || 0) * 1.1))}</div>
                            </div>
                            <div className="md:col-span-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 max-h-72 overflow-y-auto">
                                <div className="text-xs text-gray-500 mb-2">TEXT SNAPSHOT</div>
                                <div className="space-y-2">
                                    {previewLines.length > 0 ? (
                                        previewLines.map((line, idx) => (
                                            <div key={idx} className="text-sm text-gray-300 leading-relaxed">
                                                {line}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500">No text available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable data={displayData} fileName={fileName} />
                    )}
                </div>
            </div>

            {isUnstructured ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-[#121212] border-[#2a2a2a] md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Recommended Text Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Basic Cleaning</div>
                            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Tokenization</div>
                            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Filtering / Stopwords</div>
                            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Normalization / Lemmatization</div>
                            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Feature Extraction</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#121212] border-[#2a2a2a]">
                        <CardHeader>
                            <CardTitle className="text-lg">Current Dataset Type</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Unstructured Text</Badge>
                            <p className="text-gray-400">Structured-only techniques are disabled in the sidebar.</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
            <>
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
                            <RefreshCw className="h-5 w-5 mr-2 text-blue-400" />
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
                            <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#2a2a2a] text-xs" onClick={onRefreshRandomSample}>
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
                            <FileText className="h-5 w-5 mr-2 text-yellow-400" />
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
            </>
            )}
        </div>
    );
}
