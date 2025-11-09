"use client"

import { useState } from "react"
import { Button } from "../components/ui/button.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { Input } from "../components/ui/input.tsx"
import { Label } from "../components/ui/label.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx"
import { Checkbox } from "../components/ui/checkbox.tsx"
import { ArrowLeft, Play, RotateCcw } from "lucide-react"

interface MissingValuesPanelProps {
  data: any[]
  onBack: () => void
  onApply: (strategy: string, columns: string[], fillValue?: string) => void
  disabled?: boolean
}

export function MissingValuesPanel({ data, onBack, onApply, disabled = false }: MissingValuesPanelProps) {
  const [strategy, setStrategy] = useState("mean")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [fillValue, setFillValue] = useState("")
  const [selectAll, setSelectAll] = useState(false)

  // Analyze columns for missing values
  const columnAnalysis =
    data.length > 0
      ? Object.keys(data[0])
          .map((column) => {
            const values = data.map((row) => row[column])
            const missingCount = values.filter((val) => val === null || val === undefined || val === "null").length
            const missingPercentage = (missingCount / data.length) * 100
            const isNumeric = values.some(
              (val) => val !== null && val !== undefined && val !== "null" && !isNaN(Number(val)),
            )

            return {
              name: column,
              missingCount,
              missingPercentage,
              isNumeric,
              totalRows: data.length,
            }
          })
          .filter((col) => col.missingCount > 0)
      : []

  const strategies = [
    { value: "mean", label: "Mean", description: "Replace with column mean (numeric only)", requiresNumeric: true },
    {
      value: "median",
      label: "Median",
      description: "Replace with column median (numeric only)",
      requiresNumeric: true,
    },
    { value: "mode", label: "Mode", description: "Replace with most frequent value", requiresNumeric: false },
    { value: "constant", label: "Constant", description: "Replace with a constant value", requiresNumeric: false },
    { value: "forward_fill", label: "Forward Fill", description: "Use previous valid value", requiresNumeric: false },
    { value: "backward_fill", label: "Backward Fill", description: "Use next valid value", requiresNumeric: false },
    {
      value: "knn",
      label: "KNN Imputation",
      description: "Use K-Nearest Neighbors (numeric only)",
      requiresNumeric: true,
    },
    { value: "remove", label: "Remove Rows", description: "Remove rows with missing values", requiresNumeric: false },
  ]

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName) ? prev.filter((col) => col !== columnName) : [...prev, columnName],
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(columnAnalysis.map((col) => col.name))
    }
    setSelectAll(!selectAll)
  }

  const handleApply = () => {
    if (selectedColumns.length === 0) return
    onApply(strategy, selectedColumns, strategy === "constant" ? fillValue : undefined)
  }

  const getStrategyColor = (strategyValue: string) => {
    switch (strategyValue) {
      case "mean":
      case "median":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "mode":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "constant":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "forward_fill":
      case "backward_fill":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "knn":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "remove":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (columnAnalysis.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Handle Missing Values</h2>
        </div>

        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-green-400 mb-2 text-6xl">✓</div>
              <div className="text-xl font-semibold mb-2">No Missing Values Found</div>
              <div className="text-gray-400">Your dataset is complete! No missing values detected.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Handle Missing Values</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Selection */}
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-lg">Imputation Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {strategies.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={getStrategyColor(strategy)}>
                  {strategies.find((s) => s.value === strategy)?.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">{strategies.find((s) => s.value === strategy)?.description}</p>
            </div>

            {strategy === "constant" && (
              <div className="space-y-2">
                <Label htmlFor="fillValue">Fill Value</Label>
                <Input
                  id="fillValue"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="Enter constant value"
                  className="bg-[#1a1a1a] border-[#2a2a2a]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column Selection */}
        <Card className="bg-[#121212] border-[#2a2a2a] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Select Columns ({selectedColumns.length} selected)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {columnAnalysis.map((column) => {
                const selectedStrategy = strategies.find((s) => s.value === strategy)
                const isCompatible = !selectedStrategy?.requiresNumeric || column.isNumeric

                return (
                  <div
                    key={column.name}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedColumns.includes(column.name)
                        ? "border-blue-500 bg-blue-500/10"
                        : isCompatible
                          ? "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                          : "border-[#2a2a2a] bg-[#0a0a0a] opacity-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedColumns.includes(column.name)}
                        onCheckedChange={() => isCompatible && handleColumnToggle(column.name)}
                        disabled={!isCompatible}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{column.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={
                                column.isNumeric
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : "bg-green-500/20 text-green-400 border-green-500/30"
                              }
                            >
                              {column.isNumeric ? "Numeric" : "Categorical"}
                            </Badge>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              {column.missingPercentage.toFixed(1)}% missing
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {column.missingCount} missing out of {column.totalRows} rows
                        </div>
                        {!isCompatible && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Strategy not compatible with this column type
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleApply}
          disabled={disabled || selectedColumns.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          <Play className="h-4 w-4 mr-2" />
          Apply Strategy
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedColumns([])
            setStrategy("mean")
            setFillValue("")
            setSelectAll(false)
          }}
          disabled={disabled}
          className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a] px-8 py-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
