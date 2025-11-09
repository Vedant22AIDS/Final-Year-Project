"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface AdvancedChartsProps {
  data: any[]
  config: {
    type: string
    features: string[]
    analysisType: "univariate" | "bivariate" | "multivariate"
  }
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export function AdvancedCharts({ data, config }: AdvancedChartsProps) {
  const chartData = useMemo(() => {
    if (!data.length || !config.features.length) return []

    switch (config.type) {
      case "histogram":
        return generateHistogramData(data, config.features[0])
      case "boxplot":
        return generateBoxPlotData(data, config.features[0])
      case "barplot":
        return generateBarPlotData(data, config.features[0])
      case "pieplot":
        return generatePieData(data, config.features[0])
      case "scatter":
        return generateScatterData(data, config.features[0], config.features[1])
      case "line":
        return generateLineData(data, config.features[0], config.features[1])
      case "correlation_matrix":
        return generateCorrelationData(data, config.features)
      case "radar":
        return generateRadarData(data, config.features)
      default:
        return []
    }
  }, [data, config])

  const renderChart = () => {
    switch (config.type) {
      case "histogram":
      case "barplot":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "pieplot":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="x" stroke="#9ca3af" name={config.features[0]} />
              <YAxis dataKey="y" stroke="#9ca3af" name={config.features[1]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
              <Scatter fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="x" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#2a2a2a" />
              <PolarAngleAxis dataKey="feature" stroke="#9ca3af" />
              <PolarRadiusAxis stroke="#9ca3af" />
              <Radar name="Values" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )

      case "correlation_matrix":
        return (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${config.features.length}, 1fr)` }}>
            {chartData.map((row: any, i: number) =>
              row.map((cell: any, j: number) => (
                <div
                  key={`${i}-${j}`}
                  className="aspect-square flex items-center justify-center text-xs font-medium rounded"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${Math.abs(cell.correlation)})`,
                    color: Math.abs(cell.correlation) > 0.5 ? "white" : "#9ca3af",
                  }}
                >
                  {cell.correlation.toFixed(2)}
                </div>
              )),
            )}
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            Visualization type not implemented yet
          </div>
        )
    }
  }

  return <div className="h-full">{renderChart()}</div>
}

// Helper functions for data processing
function generateHistogramData(data: any[], feature: string) {
  const values = data.map((row) => Number.parseFloat(row[feature])).filter((val) => !isNaN(val))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const bins = 10
  const binSize = (max - min) / bins

  const histogram = Array.from({ length: bins }, (_, i) => ({
    name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    value: 0,
  }))

  values.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
    histogram[binIndex].value++
  })

  return histogram
}

function generateBoxPlotData(data: any[], feature: string) {
  const values = data
    .map((row) => Number.parseFloat(row[feature]))
    .filter((val) => !isNaN(val))
    .sort((a, b) => a - b)
  const q1 = values[Math.floor(values.length * 0.25)]
  const median = values[Math.floor(values.length * 0.5)]
  const q3 = values[Math.floor(values.length * 0.75)]
  const min = values[0]
  const max = values[values.length - 1]

  return [
    { name: "Min", value: min },
    { name: "Q1", value: q1 },
    { name: "Median", value: median },
    { name: "Q3", value: q3 },
    { name: "Max", value: max },
  ]
}

function generateBarPlotData(data: any[], feature: string) {
  const counts: Record<string, number> = {}
  data.forEach((row) => {
    const value = row[feature]
    counts[value] = (counts[value] || 0) + 1
  })

  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function generatePieData(data: any[], feature: string) {
  return generateBarPlotData(data, feature)
}

function generateScatterData(data: any[], xFeature: string, yFeature: string) {
  return data
    .map((row) => ({
      x: Number.parseFloat(row[xFeature]),
      y: Number.parseFloat(row[yFeature]),
    }))
    .filter((point) => !isNaN(point.x) && !isNaN(point.y))
}

function generateLineData(data: any[], xFeature: string, yFeature: string) {
  return data
    .map((row, index) => ({
      x: Number.parseFloat(row[xFeature]) || index,
      y: Number.parseFloat(row[yFeature]),
    }))
    .filter((point) => !isNaN(point.y))
    .sort((a, b) => a.x - b.x)
}

function generateCorrelationData(data: any[], features: string[]) {
  const matrix = features.map((feature1) =>
    features.map((feature2) => {
      const values1 = data.map((row) => Number.parseFloat(row[feature1])).filter((val) => !isNaN(val))
      const values2 = data.map((row) => Number.parseFloat(row[feature2])).filter((val) => !isNaN(val))

      if (feature1 === feature2) return { correlation: 1 }

      const correlation = calculateCorrelation(values1, values2)
      return { correlation }
    }),
  )

  return matrix
}

function generateRadarData(data: any[], features: string[]) {
  const means = features.map((feature) => {
    const values = data.map((row) => Number.parseFloat(row[feature])).filter((val) => !isNaN(val))
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const max = Math.max(...values)
    return {
      feature,
      value: (mean / max) * 100, // Normalize to 0-100
    }
  })

  return means
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n === 0) return 0

  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumXSquared = 0
  let sumYSquared = 0

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX
    const deltaY = y[i] - meanY
    numerator += deltaX * deltaY
    sumXSquared += deltaX * deltaX
    sumYSquared += deltaY * deltaY
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared)
  return denominator === 0 ? 0 : numerator / denominator
}
