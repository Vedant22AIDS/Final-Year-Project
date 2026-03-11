import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import type { AutoCleaningResponse } from "../hooks/use-api.ts";

interface AutoCleaningReportPanelProps {
  disabled?: boolean;
  loading?: boolean;
  reportData: AutoCleaningResponse | null;
  onBack: () => void;
  onRun: () => void;
}

export function AutoCleaningReportPanel({
  disabled = false,
  loading = false,
  reportData,
  onBack,
  onRun,
}: AutoCleaningReportPanelProps) {
  const qualityScore = reportData?.report?.quality_score ?? 0;
  const scoreColor = qualityScore >= 80 ? "text-green-400" : qualityScore >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
      <Button variant="outline" onClick={onBack} className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Overview
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1">Automated Data Cleaning + Explainable Report</h2>
          <p className="text-gray-400">Run pipeline cleanup, compare dataset quality, and view AI explanation.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onRun} disabled={disabled || loading}>
          {loading ? "Running..." : "Run Auto Cleaning"}
        </Button>
      </div>

      {!reportData ? (
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardContent className="py-8 text-sm text-gray-400">No report available yet. Click "Run Auto Cleaning" to generate one.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Dataset Quality Report</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Quality Score</div>
                <div className={`text-2xl font-bold ${scoreColor}`}>{qualityScore}</div>
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Rows (Before → After)</div>
                <div className="font-semibold">{reportData.report.rows_before} → {reportData.report.rows_after}</div>
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Missing (Before → After)</div>
                <div className="font-semibold">{reportData.report.missing_before} → {reportData.report.missing_after}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Issues Detected</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">Missing Values: {reportData.report.issues_detected.missing_values}</div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">Duplicate Rows: {reportData.report.issues_detected.duplicate_rows}</div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">Outlier Points: {reportData.report.issues_detected.outlier_points}</div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">Incorrect Data Types: {reportData.report.issues_detected.incorrect_dtypes}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Operations Performed</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {reportData.report.operations_performed.map((operation) => (
                <div key={operation} className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-2">
                  {operation}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>AI Explanation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {reportData.ai_explanation || "No AI explanation available."}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
