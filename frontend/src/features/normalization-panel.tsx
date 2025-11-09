"use client"

import { useState } from "react"
import { Button } from "../components/ui/button.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx"
import { Checkbox } from "../components/ui/checkbox.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { ArrowLeft, Play, RotateCcw, BarChart3, Code, Shuffle } from "lucide-react"

interface NormalizationPanelProps {
  data: any[]
  onBack: () => void
  onNormalize: (method: string, columns: string[]) => void
  onEncode: (method: string, columns: string[]) => void
  disabled?: boolean
}

export function NormalizationPanel({
  data,
  onBack,
  onNormalize,
  onEncode,
  disabled = false,
}: NormalizationPanelProps) {
  const [activeTab, setActiveTab] = useState("normalize")
  const [normalizeMethod, setNormalizeMethod] = useState("standard")
  const [encodeMethod, setEncodeMethod] = useState("label")
  const [selectedNormalizeColumns, setSelectedNormalizeColumns] = useState<Array<string>>([])
  const [selectedEncodeColumns, setSelectedEncodeColumns] = useState<Array<string>>([])

  // Analyze columns
  const columnAnalysis =
    data.length > 0
      ? Object.keys(data[0]).map((column) => {
          const values = data
            .map((row) => row[column])
            .filter((val) => val !== null && val !== undefined && val !== "null")
          const isNumeric = values.some((val) => !isNaN(Number(val)))
          const uniqueCount = new Set(values).size
          const totalCount = values.length

          let stats: {
            min?: number
            max?: number
            mean?: number
            std?: number
          } = {}

          if (isNumeric) {
            const numericValues = values.map((val) => Number(val)).filter((val) => !isNaN(val))
            if (numericValues.length > 0) {
              const mean =
                numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
              const std = Math.sqrt(
                numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                  numericValues.length,
              )

              stats = {
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                mean: mean,
                std: std,
              }
            }
          }

          return {
            name: column,
            isNumeric,
            uniqueCount,
            totalCount,
            stats,
            cardinality: uniqueCount / totalCount,
          }
        })
      : []

  const numericColumns = columnAnalysis.filter((col) => col.isNumeric)
  const categoricalColumns = columnAnalysis.filter((col) => !col.isNumeric)

  const normalizationMethods = [
    {
      value: "standard",
      label: "Standard Scaling",
      description: "Mean = 0, Std = 1 (Z-score normalization)",
    },
    { value: "minmax", label: "Min-Max Scaling", description: "Scale to range [0, 1]" },
    {
      value: "robust",
      label: "Robust Scaling",
      description: "Use median and IQR (less sensitive to outliers)",
    },
    { value: "zscore", label: "Z-Score", description: "Standard score normalization" },
  ]

  const encodingMethods = [
    {
      value: "label",
      label: "Label Encoding",
      description: "Convert categories to integers (0, 1, 2, ...)",
    },
    { value: "onehot", label: "One-Hot Encoding", description: "Create binary columns for each category" },
    {
      value: "binary",
      label: "Binary Encoding",
      description: "Convert to binary representation (for binary categories)",
    },
  ]

  const handleNormalizeColumnToggle = (columnName: string) => {
    setSelectedNormalizeColumns((prev) =>
      prev.includes(columnName) ? prev.filter((col) => col !== columnName) : [...prev, columnName],
    )
  }

  const handleEncodeColumnToggle = (columnName: string) => {
    setSelectedEncodeColumns((prev) =>
      prev.includes(columnName) ? prev.filter((col) => col !== columnName) : [...prev, columnName],
    )
  }

  const handleNormalizeAll = () => {
    if (selectedNormalizeColumns.length === numericColumns.length) {
      setSelectedNormalizeColumns([])
    } else {
      setSelectedNormalizeColumns(numericColumns.map((col) => col.name))
    }
  }

  const handleEncodeAll = () => {
    if (selectedEncodeColumns.length === categoricalColumns.length) {
      setSelectedEncodeColumns([])
    } else {
      setSelectedEncodeColumns(categoricalColumns.map((col) => col.name))
    }
  }

  const getMethodColor = (method: string, type: "normalize" | "encode") => {
    if (type === "normalize") {
      switch (method) {
        case "standard":
          return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        case "minmax":
          return "bg-green-500/20 text-green-400 border-green-500/30"
        case "robust":
          return "bg-purple-500/20 text-purple-400 border-purple-500/30"
        case "zscore":
          return "bg-orange-500/20 text-orange-400 border-orange-500/30"
        default:
          return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }
    } else {
      switch (method) {
        case "label":
          return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
        case "onehot":
          return "bg-pink-500/20 text-pink-400 border-pink-500/30"
        case "binary":
          return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        default:
          return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Normalize, Encode & Scale</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-[#252525]">
          <TabsTrigger value="normalize" className="data-[state=active]:bg-[#3b3b3b]">
            <BarChart3 className="h-4 w-4 mr-2" />
            Normalize Data
          </TabsTrigger>
          <TabsTrigger value="encode" className="data-[state=active]:bg-[#3b3b3b]">
            <Code className="h-4 w-4 mr-2" />
            Encode Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normalize" className="space-y-6">
          {numericColumns.length === 0 ? (
            <Card className="bg-[#121212] border-[#2a2a2a]">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-yellow-400 mb-2 text-6xl">⚠️</div>
                  <div className="text-xl font-semibold mb-2">No Numeric Columns Found</div>
                  <div className="text-gray-400">
                    Your dataset doesn't contain numeric columns that can be normalized.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Method Selection */}
              <Card className="bg-[#121212] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-lg">Normalization Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
               <Select value={normalizeMethod} onValueChange={setNormalizeMethod}>
  <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
    <SelectValue className="text-white" />
  </SelectTrigger>
  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
    {normalizationMethods.map((method) => (
      <SelectItem 
        key={method.value} 
        value={method.value}
        className="text-white hover:bg-[#333] data-[state=checked]:bg-blue-600/20"
      >
        {method.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>


                  <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getMethodColor(normalizeMethod, "normalize")}>
                        {normalizationMethods.find((m) => m.value === normalizeMethod)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {normalizationMethods.find((m) => m.value === normalizeMethod)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Column Selection */}
              <Card className="bg-[#121212] border-[#2a2a2a] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Select Numeric Columns ({selectedNormalizeColumns.length} selected)</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNormalizeAll}
                      className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                    >
                      {selectedNormalizeColumns.length === numericColumns.length ? "Deselect All" : "Select All"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {numericColumns.map((column) => (
                      <div
                        key={column.name}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedNormalizeColumns.includes(column.name)
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedNormalizeColumns.includes(column.name)}
                            onCheckedChange={() => handleNormalizeColumnToggle(column.name)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{column.name}</span>
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Numeric</Badge>
                            </div>
                            <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
                              <div>
                                Range: {column.stats.min?.toFixed(2)} - {column.stats.max?.toFixed(2)}
                              </div>
                              <div>Mean: {column.stats.mean?.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {numericColumns.length > 0 && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => onNormalize(normalizeMethod, selectedNormalizeColumns)}
                disabled={disabled || selectedNormalizeColumns.length === 0}
                className="bg-blue-900 hover:bg-blue-900 text-white px-8 py-2"
              >
                <Play className="h-4 w-4 mr-2" />
                Apply Normalization
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedNormalizeColumns([])}
                disabled={disabled}
                className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a] px-8 py-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="encode" className="space-y-6">
          {categoricalColumns.length === 0 ? (
            <Card className="bg-[#121212] border-[#2a2a2a]">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-yellow-400 mb-2 text-6xl">⚠️</div>
                  <div className="text-xl font-semibold mb-2">No Categorical Columns Found</div>
                  <div className="text-gray-400">
                    Your dataset doesn't contain categorical columns that need encoding.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Method Selection */}
              <Card className="bg-[#121212] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-lg">Encoding Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <Select value={encodeMethod} onValueChange={setEncodeMethod}>
  <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
    <SelectValue className="text-white" />
  </SelectTrigger>
  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
    {encodingMethods.map((method) => (
      <SelectItem 
        key={method.value} 
        value={method.value}
        className="text-white hover:bg-[#333] data-[state=checked]:bg-green-600/20"
      >
        {method.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

                  <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getMethodColor(encodeMethod, "encode")}>
                        {encodingMethods.find((m) => m.value === encodeMethod)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {encodingMethods.find((m) => m.value === encodeMethod)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Column Selection */}
              <Card className="bg-[#121212] border-[#2a2a2a] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Select Categorical Columns ({selectedEncodeColumns.length} selected)</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEncodeAll}
                      className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                    >
                      {selectedEncodeColumns.length === categoricalColumns.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {categoricalColumns.map((column) => {
                      const isCompatible = encodeMethod !== "binary" || column.uniqueCount === 2
                      const tooManyCategories = encodeMethod === "onehot" && column.uniqueCount > 20

                      return (
                        <div
                          key={column.name}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedEncodeColumns.includes(column.name)
                              ? "border-blue-500 bg-blue-500/10"
                              : isCompatible && !tooManyCategories
                              ? "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                              : "border-[#2a2a2a] bg-[#0a0a0a] opacity-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedEncodeColumns.includes(column.name)}
                              onCheckedChange={() =>
                                isCompatible && !tooManyCategories && handleEncodeColumnToggle(column.name)
                              }
                              disabled={!isCompatible || tooManyCategories}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{column.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Categorical
                                  </Badge>
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    {column.uniqueCount} unique
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400">
                                Cardinality: {(column.cardinality * 100).toFixed(1)}%
                              </div>
                              {!isCompatible && (
                                <div className="text-xs text-yellow-400 mt-1">
                                  Binary encoding requires exactly 2 unique values
                                </div>
                              )}
                              {tooManyCategories && (
                                <div className="text-xs text-yellow-400 mt-1">
                                  Too many categories for one-hot encoding (&gt;20)
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
          )}

          {categoricalColumns.length > 0 && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => onEncode(encodeMethod, selectedEncodeColumns)}
                disabled={disabled || selectedEncodeColumns.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Apply Encoding
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedEncodeColumns([])}
                disabled={disabled}
                className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a] px-8 py-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
