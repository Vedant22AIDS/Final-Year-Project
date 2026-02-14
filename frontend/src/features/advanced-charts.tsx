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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ZAxis,
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
const EMPTY_STATE = <div className="flex items-center justify-center h-full text-gray-400">No valid data for this chart</div>

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
      case "violin":
        return generateViolinData(data, config.features[0])
      case "scatter":
        return generateScatterData(data, config.features[0], config.features[1])
      case "line":
        return generateLineData(data, config.features[0], config.features[1])
      case "heatmap":
        return generateHeatmapData(data, config.features[0], config.features[1])
      case "boxplot_grouped":
        return generateGroupedBoxData(data, config.features[0], config.features[1])
      case "barplot_grouped":
        return generateGroupedBarData(data, config.features[0], config.features[1])
      case "correlation_matrix":
        return generateCorrelationData(data, config.features)
      case "parallel_coordinates":
        return generateParallelCoordinatesData(data, config.features)
      case "pairplot":
        return generatePairPlotData(data, config.features)
      case "bubble":
        return generateBubbleData(data, config.features[0], config.features[1], config.features[2])
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
      case "boxplot":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
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
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
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

      case "violin":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <ReferenceLine y={0} stroke="#2a2a2a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
              <Area type="monotone" dataKey="positive" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Area type="monotone" dataKey="negative" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "scatter":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
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
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
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

      case "heatmap":
        return renderHeatmap(chartData)

      case "boxplot_grouped":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                formatter={(value: any, name: any, entry: any) => [
                  `${Number(value).toFixed(2)} (${entry.payload.q1.toFixed(2)}-${entry.payload.q3.toFixed(2)})`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="median" fill="#3b82f6" name="Median" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "barplot_grouped":
        if (!chartData || !Array.isArray((chartData as any).data) || (chartData as any).data.length === 0) return EMPTY_STATE
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(chartData as any).data}>
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
              <Legend />
              {(chartData as any).keys.map((key: string, index: number) => (
                <Bar key={key} dataKey={key} stackId="grouped" fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "radar":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
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
        return renderCorrelationMatrix(chartData, config.features)

      case "parallel_coordinates":
        return renderParallelCoordinates(chartData)

      case "pairplot":
        return renderPairPlot(chartData)

      case "bubble":
        if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="x" stroke="#9ca3af" name={config.features[0]} />
              <YAxis dataKey="y" stroke="#9ca3af" name={config.features[1]} />
              <ZAxis dataKey="z" range={[40, 400]} name={config.features[2]} />
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

function renderCorrelationMatrix(chartData: any, features: string[]) {
  if (!Array.isArray(chartData) || chartData.length === 0) return EMPTY_STATE
  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-2 min-w-[540px]" style={{ gridTemplateColumns: `120px repeat(${features.length}, minmax(64px, 1fr))` }}>
        <div />
        {features.map((label) => (
          <div key={`h-${label}`} className="text-xs text-gray-400 truncate text-center">
            {label}
          </div>
        ))}
        {chartData.map((row: any, i: number) => (
          <div key={`row-wrap-${i}`} className="contents">
            <div className="text-xs text-gray-400 truncate py-2">{features[i]}</div>
            {row.map((cell: any, j: number) => (
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
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderHeatmap(chartData: any) {
  if (!chartData || !Array.isArray(chartData.cells) || chartData.cells.length === 0) return EMPTY_STATE
  const max = chartData.max || 1
  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-1 min-w-[540px]" style={{ gridTemplateColumns: `120px repeat(${chartData.xLabels.length}, minmax(48px, 1fr))` }}>
        <div />
        {chartData.xLabels.map((label: string) => (
          <div key={`x-${label}`} className="text-[10px] text-gray-400 truncate text-center">
            {label}
          </div>
        ))}
        {chartData.yLabels.map((label: string, yIndex: number) => (
          <div key={`y-wrap-${yIndex}`} className="contents">
            <div className="text-[10px] text-gray-400 truncate py-1">{label}</div>
            {chartData.cells[yIndex].map((count: number, xIndex: number) => (
              <div
                key={`${yIndex}-${xIndex}`}
                className="aspect-square rounded text-[10px] flex items-center justify-center"
                style={{ backgroundColor: `rgba(59, 130, 246, ${count / max})` }}
              >
                {count > 0 ? count : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderParallelCoordinates(chartData: any) {
  if (!chartData || !Array.isArray(chartData.features) || chartData.features.length < 3 || !Array.isArray(chartData.lines) || chartData.lines.length === 0) {
    return EMPTY_STATE
  }

  const width = 900
  const height = 440
  const paddingX = 80
  const paddingY = 32
  const axisGap = (width - paddingX * 2) / (chartData.features.length - 1)

  const scaleY = (value: number, index: number) => {
    const range = chartData.ranges[index]
    if (!range || range.max === range.min) return height / 2
    const ratio = (value - range.min) / (range.max - range.min)
    return height - paddingY - ratio * (height - paddingY * 2)
  }

  return (
    <div className="h-full overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full min-w-[700px]">
        {chartData.features.map((feature: string, index: number) => {
          const x = paddingX + axisGap * index
          return (
            <g key={feature}>
              <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#374151" strokeWidth="1.5" />
              <text x={x} y={18} fill="#9ca3af" fontSize="11" textAnchor="middle">
                {feature}
              </text>
            </g>
          )
        })}
        {chartData.lines.map((line: number[], i: number) => {
          const d = line
            .map((value, index) => {
              const x = paddingX + axisGap * index
              const y = scaleY(value, index)
              return `${index === 0 ? "M" : "L"} ${x} ${y}`
            })
            .join(" ")
          return <path key={`line-${i}`} d={d} fill="none" stroke="rgba(59,130,246,0.16)" strokeWidth="1.1" />
        })}
      </svg>
    </div>
  )
}

function renderPairPlot(chartData: any) {
  if (!chartData || !Array.isArray(chartData.features) || chartData.features.length < 2 || !Array.isArray(chartData.matrix)) return EMPTY_STATE
  const features = chartData.features
  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: `120px repeat(${features.length}, minmax(72px, 1fr))` }}>
        <div />
        {features.map((f: string) => (
          <div key={`header-${f}`} className="text-[10px] text-gray-400 truncate text-center">
            {f}
          </div>
        ))}
        {features.map((rowFeature: string, i: number) => (
          <div key={`pair-row-${rowFeature}`} className="contents">
            <div className="text-[10px] text-gray-400 truncate py-1">{rowFeature}</div>
            {features.map((colFeature: string, j: number) => {
              if (i === j) {
                const histogram = chartData.diagonals[rowFeature] || []
                return (
                  <div key={`${i}-${j}`} className="h-[72px] rounded bg-[#111] border border-[#2a2a2a] p-1 flex items-end gap-[1px]">
                    {histogram.map((item: any, idx: number) => (
                      <div
                        key={`${i}-${j}-bar-${idx}`}
                        className="flex-1 bg-blue-500/60"
                        style={{ height: `${Math.max(6, item.norm * 100)}%` }}
                        title={`${item.label}: ${item.value}`}
                      />
                    ))}
                  </div>
                )
              }
              const corr = chartData.matrix[i][j]
              return (
                <div
                  key={`${i}-${j}`}
                  className="h-[72px] rounded border border-[#2a2a2a] text-xs flex items-center justify-center"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${Math.abs(corr)})`,
                    color: Math.abs(corr) > 0.5 ? "white" : "#9ca3af",
                  }}
                >
                  {corr.toFixed(2)}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {chartData.originalFeatureCount > features.length && (
        <div className="text-xs text-gray-500 mt-3">Showing first {features.length} features for readability.</div>
      )}
    </div>
  )
}

// Helper functions for data processing
function toNumber(value: any): number | null {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toCategory(value: any): string {
  if (value === null || value === undefined || value === "") return "Missing"
  return String(value)
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1] ?? sorted[base]
  return sorted[base] + rest * (next - sorted[base])
}

function generateHistogramData(data: any[], feature: string) {
  const values = data.map((row) => toNumber(row[feature])).filter((val): val is number => val !== null)
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{ name: `${min.toFixed(2)}`, value: values.length }]

  const bins = Math.min(20, Math.max(6, Math.round(Math.sqrt(values.length))))
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
    .map((row) => toNumber(row[feature]))
    .filter((val): val is number => val !== null)
    .sort((a, b) => a - b)
  if (!values.length) return []
  const q1 = quantile(values, 0.25)
  const median = quantile(values, 0.5)
  const q3 = quantile(values, 0.75)
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
    const value = toCategory(row[feature])
    counts[value] = (counts[value] || 0) + 1
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 12)
  const otherCount = sorted.slice(12).reduce((sum, [, count]) => sum + count, 0)
  if (otherCount > 0) top.push(["Other", otherCount])
  return top.map(([name, value]) => ({ name, value }))
}

function generatePieData(data: any[], feature: string) {
  return generateBarPlotData(data, feature)
}

function generateScatterData(data: any[], xFeature: string, yFeature: string) {
  return data
    .map((row) => {
      const x = toNumber(row[xFeature])
      const y = toNumber(row[yFeature])
      if (x === null || y === null) return null
      return { x, y }
    })
    .filter((point): point is { x: number; y: number } => point !== null)
}

function generateLineData(data: any[], xFeature: string, yFeature: string) {
  const numericX = data.some((row) => toNumber(row[xFeature]) !== null)
  return data
    .map((row, index) => ({
      x: numericX ? toNumber(row[xFeature]) ?? index : index,
      y: toNumber(row[yFeature]),
    }))
    .filter((point): point is { x: number; y: number } => point.y !== null)
    .map((point) => ({ x: point.x, y: point.y as number }))
    .sort((a, b) => a.x - b.x)
}

function generateViolinData(data: any[], feature: string) {
  const histogram = generateHistogramData(data, feature)
  if (!histogram.length) return []
  return histogram.map((bin) => ({
    name: bin.name,
    positive: bin.value,
    negative: -bin.value,
  }))
}

function generateHeatmapData(data: any[], xFeature: string, yFeature: string) {
  const xNumeric = data.filter((row) => toNumber(row[xFeature]) !== null).length > data.length * 0.8
  const yNumeric = data.filter((row) => toNumber(row[yFeature]) !== null).length > data.length * 0.8

  if (xNumeric && yNumeric) {
    const pairs = data
      .map((row) => {
        const x = toNumber(row[xFeature])
        const y = toNumber(row[yFeature])
        if (x === null || y === null) return null
        return { x, y }
      })
      .filter((pair): pair is { x: number; y: number } => pair !== null)
    if (!pairs.length) return { xLabels: [], yLabels: [], cells: [], max: 0 }

    const xMin = Math.min(...pairs.map((p) => p.x))
    const xMax = Math.max(...pairs.map((p) => p.x))
    const yMin = Math.min(...pairs.map((p) => p.y))
    const yMax = Math.max(...pairs.map((p) => p.y))
    const bins = 10
    const xSize = xMax === xMin ? 1 : (xMax - xMin) / bins
    const ySize = yMax === yMin ? 1 : (yMax - yMin) / bins
    const cells = Array.from({ length: bins }, () => Array.from({ length: bins }, () => 0))

    pairs.forEach((p) => {
      const xIdx = Math.min(bins - 1, Math.floor((p.x - xMin) / xSize))
      const yIdx = Math.min(bins - 1, Math.floor((p.y - yMin) / ySize))
      cells[bins - 1 - yIdx][xIdx] += 1
    })

    return {
      xLabels: Array.from({ length: bins }, (_, i) => `${(xMin + i * xSize).toFixed(1)}`),
      yLabels: Array.from({ length: bins }, (_, i) => `${(yMin + (bins - 1 - i) * ySize).toFixed(1)}`),
      cells,
      max: Math.max(1, ...cells.flat()),
    }
  }

  const xCounts: Record<string, number> = {}
  const yCounts: Record<string, number> = {}
  const cross: Record<string, Record<string, number>> = {}
  data.forEach((row) => {
    const x = toCategory(row[xFeature])
    const y = toCategory(row[yFeature])
    xCounts[x] = (xCounts[x] || 0) + 1
    yCounts[y] = (yCounts[y] || 0) + 1
    cross[y] = cross[y] || {}
    cross[y][x] = (cross[y][x] || 0) + 1
  })

  const xLabels = Object.entries(xCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label]) => label)
  const yLabels = Object.entries(yCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label]) => label)
  const cells = yLabels.map((y) => xLabels.map((x) => cross[y]?.[x] || 0))

  return { xLabels, yLabels, cells, max: Math.max(1, ...cells.flat()) }
}

function generateGroupedBoxData(data: any[], featureA: string, featureB: string) {
  const aNumeric = data.filter((row) => toNumber(row[featureA]) !== null).length > data.length * 0.8
  const categoryFeature = aNumeric ? featureB : featureA
  const numericFeature = aNumeric ? featureA : featureB
  const grouped: Record<string, number[]> = {}

  data.forEach((row) => {
    const category = toCategory(row[categoryFeature])
    const value = toNumber(row[numericFeature])
    if (value === null) return
    grouped[category] = grouped[category] || []
    grouped[category].push(value)
  })

  return Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .map(([name, values]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return {
        name,
        min: sorted[0],
        q1: quantile(sorted, 0.25),
        median: quantile(sorted, 0.5),
        q3: quantile(sorted, 0.75),
        max: sorted[sorted.length - 1],
      }
    })
}

function generateGroupedBarData(data: any[], featureA: string, featureB: string) {
  const grouped: Record<string, Record<string, number>> = {}
  const aCounts: Record<string, number> = {}
  const bCounts: Record<string, number> = {}

  data.forEach((row) => {
    const a = toCategory(row[featureA])
    const b = toCategory(row[featureB])
    aCounts[a] = (aCounts[a] || 0) + 1
    bCounts[b] = (bCounts[b] || 0) + 1
    grouped[a] = grouped[a] || {}
    grouped[a][b] = (grouped[a][b] || 0) + 1
  })

  const keysA = Object.entries(aCounts)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 8)
    .map(([k]) => k)
  const keysB = Object.entries(bCounts)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 6)
    .map(([k]) => k)

  const rows = keysA.map((a) => {
    const row: Record<string, any> = { name: a }
    keysB.forEach((b) => {
      row[b] = grouped[a]?.[b] || 0
    })
    return row
  })

  return { data: rows, keys: keysB }
}

function generateParallelCoordinatesData(data: any[], features: string[]) {
  const lines = data
    .map((row) => features.map((feature) => toNumber(row[feature])))
    .filter((line) => line.every((value) => value !== null))
    .map((line) => line as number[])
    .slice(0, 150)
  if (!lines.length || features.length < 3) return { features: [], ranges: [], lines: [] }

  const ranges = features.map((_, idx) => {
    const values = lines.map((line) => line[idx])
    return { min: Math.min(...values), max: Math.max(...values) }
  })

  return { features, ranges, lines }
}

function generatePairPlotData(data: any[], features: string[]) {
  const limited = features.slice(0, 5)
  const matrix = limited.map((feature1) =>
    limited.map((feature2) => {
      if (feature1 === feature2) return 1
      const pairs = data
        .map((row) => ({ x: toNumber(row[feature1]), y: toNumber(row[feature2]) }))
        .filter((pair): pair is { x: number; y: number } => pair.x !== null && pair.y !== null)
      if (pairs.length < 2) return 0
      return calculateCorrelation(
        pairs.map((p) => p.x),
        pairs.map((p) => p.y),
      )
    }),
  )

  const diagonals: Record<string, { label: string; value: number; norm: number }[]> = {}
  limited.forEach((feature) => {
    const histogram = generateHistogramData(data, feature)
    const max = Math.max(1, ...histogram.map((bin) => bin.value))
    diagonals[feature] = histogram.map((bin) => ({ label: bin.name, value: bin.value, norm: bin.value / max }))
  })

  return { features: limited, originalFeatureCount: features.length, matrix, diagonals }
}

function generateBubbleData(data: any[], xFeature: string, yFeature: string, zFeature: string) {
  const points = data
    .map((row) => {
      const x = toNumber(row[xFeature])
      const y = toNumber(row[yFeature])
      const z = toNumber(row[zFeature])
      if (x === null || y === null || z === null) return null
      return { x, y, z }
    })
    .filter((point): point is { x: number; y: number; z: number } => point !== null)
  if (!points.length) return []

  const minZ = Math.min(...points.map((p) => p.z))
  const maxZ = Math.max(...points.map((p) => p.z))
  return points.map((p) => ({
    ...p,
    z: maxZ === minZ ? 1 : ((p.z - minZ) / (maxZ - minZ)) * 10 + 1,
  }))
}

function generateCorrelationData(data: any[], features: string[]) {
  if (features.length < 2) return []
  const matrix = features.map((feature1) =>
    features.map((feature2) => {
      if (feature1 === feature2) return { correlation: 1 }
      const pairs = data
        .map((row) => ({ x: toNumber(row[feature1]), y: toNumber(row[feature2]) }))
        .filter((pair): pair is { x: number; y: number } => pair.x !== null && pair.y !== null)
      if (pairs.length < 2) return { correlation: 0 }

      const correlation = calculateCorrelation(
        pairs.map((p) => p.x),
        pairs.map((p) => p.y),
      )
      return { correlation }
    }),
  )

  return matrix
}

function generateRadarData(data: any[], features: string[]) {
  const means = features
    .map((feature) => {
      const values = data.map((row) => toNumber(row[feature])).filter((val): val is number => val !== null)
      if (!values.length) return null
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      return {
        feature,
        value: max === min ? 50 : ((mean - min) / (max - min)) * 100,
      }
    })
    .filter((row): row is { feature: string; value: number } => row !== null)

  return means
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

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
