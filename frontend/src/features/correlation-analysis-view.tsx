"use client"

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"

interface CorrelationAnalysisViewProps {
  data: any
}

export function CorrelationAnalysisView({ data }: CorrelationAnalysisViewProps) {
  if (!data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">No correlation data available</div>
  }

  if (data.numericalColumns.length < 2) {
    return (
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Insufficient Data</div>
            <div className="text-sm text-gray-500">
              Correlation analysis requires at least 2 numerical columns.
              <br />
              Found {data.numericalColumns.length} numerical column(s).
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "strong":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "moderate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "weak":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Correlation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{data.numericalColumns.length}</div>
              <div className="text-sm text-gray-400">Numerical Variables</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{data.strongCorrelations.length}</div>
              <div className="text-sm text-gray-400">Strong Correlations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {(data.numericalColumns.length * (data.numericalColumns.length - 1)) / 2}
              </div>
              <div className="text-sm text-gray-400">Total Pairs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-gray-300">{insight}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strong Correlations */}
      {data.strongCorrelations.length > 0 && (
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle>Strong Correlations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.strongCorrelations.map((corr: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{corr.col1}</div>
                    <div className="text-gray-400">↔</div>
                    <div className="font-medium">{corr.col2}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStrengthBadge(corr.strength)}>{corr.strength}</Badge>
                    <div className="text-sm text-gray-400">{corr.direction}</div>
                    <div className="font-mono text-sm font-medium">{corr.correlation.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation Matrix */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Correlation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `120px repeat(${data.numericalColumns.length}, 80px)` }}
              >
                {/* Header row */}
                <div></div>
                {data.numericalColumns.map((col: string) => (
                  <div key={col} className="text-xs text-gray-400 p-2 text-center truncate">
                    {col}
                  </div>
                ))}

                {/* Data rows */}
                {data.numericalColumns.map((rowCol: string, i: number) => (
                  <React.Fragment key={rowCol}>
                    <div className="text-xs text-gray-400 p-2 truncate">{rowCol}</div>
                    {data.correlationMatrix[i].map((cell: any, j: number) => (
                      <div
                        key={j}
                        className="aspect-square flex items-center justify-center text-xs font-medium rounded relative"
                        style={{
                          backgroundColor: `rgba(${cell.value > 0 ? "34, 197, 94" : "239, 68, 68"}, ${Math.abs(cell.value) * 0.8})`,
                          color: Math.abs(cell.value) > 0.5 ? "white" : "#9ca3af",
                        }}
                        title={`${data.numericalColumns[i]} vs ${data.numericalColumns[j]}: ${cell.value.toFixed(3)}`}
                      >
                        {cell.value.toFixed(2)}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Positive Correlation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Negative Correlation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Weak Correlation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
