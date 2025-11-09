"use client"

import { useState, useEffect } from "react"
import { DistributionChart } from "./Distribution-chart.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../src/components/ui/select.tsx"

interface TechniquePanelProps {
  technique: {
    column: string
    count: string
    missing: string
    mean: string
    categories: string
  }
  selectedColumn: string
  data: any[]
  onImputationStrategyChange: (strategy: string) => void
}

export function TechniquePanel({ technique, selectedColumn, data, onImputationStrategyChange }: TechniquePanelProps) {
  const [stats, setStats] = useState({
    mean: "0",
    median: "0",
    mode: "0",
    std: "0",
    count: "0",
    variance: "0",
    range: "0",
    missing: "0",
    categories: "0",
  })

  const [imputationStrategy, setImputationStrategy] = useState("mean")
  const [visualizationType, setVisualizationType] = useState("distribution")
  const [distributionData, setDistributionData] = useState<any[]>([])

  // Calculate statistics when selected column changes
  useEffect(() => {
    if (!data || data.length === 0 || !selectedColumn) return

    const columnData = data.map((row) => Number.parseFloat(row[selectedColumn])).filter((val) => !isNaN(val))

    if (columnData.length === 0) return

    // Calculate statistics
    const mean = columnData.reduce((sum, val) => sum + val, 0) / columnData.length

    // Sort for median and range
    const sortedData = [...columnData].sort((a, b) => a - b)
    const median =
      sortedData.length % 2 === 0
        ? (sortedData[sortedData.length / 2 - 1] + sortedData[sortedData.length / 2]) / 2
        : sortedData[Math.floor(sortedData.length / 2)]

    // Mode calculation
    const counts = columnData.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    const mode = Object.entries(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))

    // Standard deviation and variance
    const variance = columnData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / columnData.length
    const std = Math.sqrt(variance)

    // Range
    const range = sortedData[sortedData.length - 1] - sortedData[0]

    // Missing values
    const missing = data.length - columnData.length

    // Categories (unique values)
    const uniqueValues = new Set(columnData).size

    setStats({
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      mode: typeof mode === "string" ? mode : mode.toString(),
      std: std.toFixed(2),
      variance: variance.toFixed(2),
      range: range.toFixed(2),
      count: columnData.length.toString(),
      missing: missing.toString(),
      categories: uniqueValues.toString(),
    })

    // Create distribution data for the chart
    const min = Math.min(...columnData)
    const max = Math.max(...columnData)
    const binCount = 10
    const binSize = (max - min) / binCount

    const bins = Array(binCount)
      .fill(0)
      .map((_, i) => ({
        bin: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        count: 0,
        binStart: min + i * binSize,
        binEnd: min + (i + 1) * binSize,
      }))

    columnData.forEach((val) => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), binCount - 1)
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].count++
      }
    })

    setDistributionData(bins)
  }, [selectedColumn, data])

  const handleImputationStrategyChange = (value: string) => {
    setImputationStrategy(value)
    onImputationStrategyChange(value)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium">Columns</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 ml-1"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">Type</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 ml-1"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Column</span>
              <span className="text-sm">{selectedColumn || technique.column}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Count</span>
              <span className="text-sm">{stats.count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Missing</span>
              <span className="text-sm">{stats.missing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Mean</span>
              <span className="text-sm">{stats.mean}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Median</span>
              <span className="text-sm">{stats.median}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Mode</span>
              <span className="text-sm">{stats.mode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Std Dev</span>
              <span className="text-sm">{stats.std}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Variance</span>
              <span className="text-sm">{stats.variance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Range</span>
              <span className="text-sm">{stats.range}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Categories</span>
              <span className="text-sm">{stats.categories}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs mr-4">Before</span>
            <div className="h-3 w-3 rounded-full bg-teal-500 mr-2"></div>
            <span className="text-xs">After (imputed)</span>
          </div>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#2a2a2a] rounded-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium">Smart imputation</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 ml-1"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{selectedColumn}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 ml-1"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">Strategy</span>
            <Select value={imputationStrategy} onValueChange={handleImputationStrategyChange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean</SelectItem>
                <SelectItem value="median">Median</SelectItem>
                <SelectItem value="mode">Mode</SelectItem>
                <SelectItem value="constant">Constant</SelectItem>
                <SelectItem value="knn">KNN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-40 mt-4">
            <DistributionChart data={distributionData} />
          </div>

          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>0</span>
            <span>Values</span>
            <span>50</span>
          </div>
        </div>
      </div>
    </div>
  )
}
