"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { Progress } from "../components/ui/progress.tsx"

interface DataSummaryViewProps {
  data: any
}

export function DataSummaryView({ data }: DataSummaryViewProps) {
  if (!data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">No summary data available</div>
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "numeric":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "categorical":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "boolean":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "datetime":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Dataset Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{data.overview.totalRows.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{data.overview.totalColumns}</div>
              <div className="text-sm text-gray-400">Total Columns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{data.overview.memoryUsage}</div>
              <div className="text-sm text-gray-400">Memory Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Types Distribution */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Data Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["numeric", "categorical", "boolean", "datetime"].map((type) => {
              const count = data.columns.filter((col: any) => col.dataType === type).length
              const percentage = ((count / data.columns.length) * 100).toFixed(1)
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-gray-400 capitalize">{type}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Column Details */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.columns.map((column: any, index: number) => (
              <div key={index} className="border border-[#2a2a2a] rounded-lg p-4 bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-lg">{column.name}</h3>
                    <Badge className={getTypeColor(column.dataType)}>{column.dataType}</Badge>
                  </div>
                  <div className="text-sm text-gray-400">
                    {column.stats.missing > 0 && (
                      <span className="text-red-400">{column.stats.missingPercentage}% missing</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Count</div>
                    <div className="font-medium">{column.stats.count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Unique</div>
                    <div className="font-medium">{column.stats.unique.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Missing</div>
                    <div className="font-medium text-red-400">{column.stats.missing.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Unique %</div>
                    <div className="font-medium">{column.stats.uniquePercentage}%</div>
                  </div>
                </div>

                {column.stats.missing > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Completeness</span>
                      <span>{(100 - Number.parseFloat(column.stats.missingPercentage)).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - Number.parseFloat(column.stats.missingPercentage)} className="h-2" />
                  </div>
                )}

                {column.isNumeric ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Mean</div>
                      <div className="font-medium">{column.stats.mean}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Median</div>
                      <div className="font-medium">{column.stats.median}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Std Dev</div>
                      <div className="font-medium">{column.stats.std}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Range</div>
                      <div className="font-medium">
                        {column.stats.min} - {column.stats.max}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Top Values</div>
                    <div className="space-y-1">
                      {column.stats.topValues?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="truncate max-w-[200px]">{item.value}</span>
                          <span className="text-gray-400">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                  <div className="text-sm text-gray-400 mb-1">Sample Values</div>
                  <div className="text-sm text-gray-300">
                    {column.sampleValues
                      .slice(0, 5)
                      .map((val: any) => String(val))
                      .join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
