import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import type { AutoCleaningResponse } from "../hooks/use-api.ts";

interface AutoCleaningReportPanelProps {
  onBack: () => void;
  onRun: () => void;
  disabled?: boolean;
  loading?: boolean;
  reportData: AutoCleaningResponse | null;
}

export function AutoCleaningReportPanel({
  onBack,
  onRun,
  disabled = false,
  loading = false,
  reportData,
}: AutoCleaningReportPanelProps) {
  const score = reportData?.turnitin_style_report?.quality_score ?? 0;
  const scoreColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
      <Button
        variant="outline"
        onClick={onBack}
        className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Overview
      </Button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1">Automated Cleaning + Turnitin-Style Report</h2>
          <p className="text-gray-400">Run automated preprocessing and review the explainable quality report.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onRun} disabled={disabled || loading}>
          {loading ? "Running..." : "Run"}
        </Button>
      </div>

      {!reportData ? (
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardContent className="py-8 text-sm text-gray-400 space-y-2">
            {!loading ? (
              <div>Upload a dataset, open this panel, then click Run to generate auto cleaning output and report.</div>
            ) : (
              <>
                <div className="text-blue-300 font-medium">Auto cleaning is running...</div>
                <div>1. Scanning dataset summary and metadata</div>
                <div>2. Applying duplicate/missing/type/outlier fixes</div>
                <div>3. Generating Turnitin-style quality report</div>
                <div>4. Preparing AI explanation</div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Quality Report</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Quality Score</div>
                <div className={`text-2xl font-bold ${scoreColor}`}>{score}</div>
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Rows</div>
                <div className="font-semibold">
                  {reportData.turnitin_style_report.rows_before} → {reportData.turnitin_style_report.rows_after}
                </div>
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="text-gray-400">Missing Values</div>
                <div className="font-semibold">
                  {reportData.turnitin_style_report.missing_before} → {reportData.turnitin_style_report.missing_after}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Issues Detected</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                Missing Values: {reportData.turnitin_style_report.issues_detected.missing_values}
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                Duplicate Rows: {reportData.turnitin_style_report.issues_detected.duplicate_rows}
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                Outlier Points: {reportData.turnitin_style_report.issues_detected.outlier_points}
              </div>
              <div className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                Incorrect Data Types: {reportData.turnitin_style_report.issues_detected.incorrect_dtypes}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>Operations Performed</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {reportData.turnitin_style_report.operations_performed.map((op) => (
                <div key={op} className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-2">
                  {op}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#121212] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle>AI Explanation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {reportData.ai_explanation}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
