"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { BarChart3, ScatterChartIcon as Scatter, PieChart, TrendingUp, Grid3X3, Layers } from "lucide-react"

interface ColumnInfo {
  name: string
  type: "numerical" | "categorical" | "datetime"
  uniqueValues: number
  missingValues: number
  sampleValues: any[]
}

interface VisualizationPanelProps {
  data: any[]
  onVisualizationGenerate: (config: VisualizationConfig) => void
}

interface VisualizationConfig {
  type: string
  features: string[]
  analysisType: "univariate" | "bivariate" | "multivariate"
}

const VISUALIZATION_TYPES = {
  univariate: [
    {
      id: "histogram",
      name: "Histogram",
      icon: BarChart3,
      description: "Distribution of numerical data",
      requires: ["numerical"],
    },
    {
      id: "boxplot",
      name: "Box Plot",
      icon: BarChart3,
      description: "Statistical summary with outliers",
      requires: ["numerical"],
    },
    {
      id: "barplot",
      name: "Bar Plot",
      icon: BarChart3,
      description: "Frequency of categorical data",
      requires: ["categorical"],
    },
    {
      id: "pieplot",
      name: "Pie Chart",
      icon: PieChart,
      description: "Proportions of categories",
      requires: ["categorical"],
    },
    {
      id: "violin",
      name: "Violin Plot",
      icon: TrendingUp,
      description: "Distribution shape and density",
      requires: ["numerical"],
    },
  ],
  bivariate: [
    {
      id: "scatter",
      name: "Scatter Plot",
      icon: Scatter,
      description: "Relationship between two numerical variables",
      requires: ["numerical", "numerical"],
    },
    {
      id: "line",
      name: "Line Plot",
      icon: TrendingUp,
      description: "Trend over time or ordered data",
      requires: ["numerical", "numerical"],
    },
    {
      id: "heatmap",
      name: "Heatmap",
      icon: Grid3X3,
      description: "Correlation or cross-tabulation",
      requires: ["numerical", "numerical"],
    },
    {
      id: "boxplot_grouped",
      name: "Grouped Box Plot",
      icon: BarChart3,
      description: "Numerical distribution by category",
      requires: ["categorical", "numerical"],
    },
    {
      id: "barplot_grouped",
      name: "Grouped Bar Plot",
      icon: BarChart3,
      description: "Comparison across categories",
      requires: ["categorical", "categorical"],
    },
  ],
  multivariate: [
    {
      id: "correlation_matrix",
      name: "Correlation Matrix",
      icon: Grid3X3,
      description: "Relationships between multiple variables",
      requires: ["numerical"],
    },
    {
      id: "parallel_coordinates",
      name: "Parallel Coordinates",
      icon: Layers,
      description: "Multi-dimensional patterns",
      requires: ["numerical"],
    },
    {
      id: "pairplot",
      name: "Pair Plot",
      icon: Scatter,
      description: "Pairwise relationships matrix",
      requires: ["numerical"],
    },
    {
      id: "bubble",
      name: "Bubble Chart",
      icon: Scatter,
      description: "Three-dimensional relationships",
      requires: ["numerical", "numerical", "numerical"],
    },
    {
      id: "radar",
      name: "Radar Chart",
      icon: Grid3X3,
      description: "Multi-dimensional comparison",
      requires: ["numerical"],
    },
  ],
}

export function VisualizationPanel({ data, onVisualizationGenerate }: VisualizationPanelProps) {
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [analysisType, setAnalysisType] = useState<"univariate" | "bivariate" | "multivariate">("univariate")
  const [selectedVisualization, setSelectedVisualization] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Analyze columns and detect types
  useEffect(() => {
    if (data.length === 0) return

    const analyzedColumns: ColumnInfo[] = Object.keys(data[0]).map((colName) => {
      const values = data.map((row) => row[colName]).filter((val) => val !== null && val !== undefined && val !== "")
      const uniqueValues = new Set(values).size
      const missingValues = data.length - values.length

      // Detect column type
      let type: "numerical" | "categorical" | "datetime" = "categorical"

      // Check if numerical
      const numericValues = values.filter((val) => !isNaN(Number(val)))
      if (numericValues.length > values.length * 0.8) {
        type = "numerical"
      }

      // Check if datetime
      const dateValues = values.filter((val) => !isNaN(Date.parse(val)))
      if (dateValues.length > values.length * 0.8) {
        type = "datetime"
      }

      // If too many unique values for categorical, might be numerical
      if (type === "categorical" && uniqueValues > values.length * 0.5) {
        type = "numerical"
      }

      return {
        name: colName,
        type,
        uniqueValues,
        missingValues,
        sampleValues: values.slice(0, 5),
      }
    })

    setColumns(analyzedColumns)
  }, [data])

  // Generate smart suggestions based on selected features
  useEffect(() => {
    if (selectedFeatures.length === 0) {
      setSuggestions([])
      return
    }

    const featureTypes = selectedFeatures.map((feature) => columns.find((col) => col.name === feature)?.type)

    const newSuggestions: string[] = []

    if (selectedFeatures.length === 1) {
      const type = featureTypes[0]
      if (type === "numerical") {
        newSuggestions.push("histogram", "boxplot", "violin")
      } else if (type === "categorical") {
        newSuggestions.push("barplot", "pieplot")
      }
    } else if (selectedFeatures.length === 2) {
      const [type1, type2] = featureTypes
      if (type1 === "numerical" && type2 === "numerical") {
        newSuggestions.push("scatter", "line", "heatmap")
      } else if (
        (type1 === "categorical" && type2 === "numerical") ||
        (type1 === "numerical" && type2 === "categorical")
      ) {
        newSuggestions.push("boxplot_grouped")
      } else if (type1 === "categorical" && type2 === "categorical") {
        newSuggestions.push("barplot_grouped", "heatmap")
      }
    } else if (selectedFeatures.length >= 3) {
      const numericalCount = featureTypes.filter((type) => type === "numerical").length
      if (numericalCount >= 3) {
        newSuggestions.push("correlation_matrix", "parallel_coordinates", "pairplot")
      }
      if (numericalCount === 3) {
        newSuggestions.push("bubble")
      }
    }

    setSuggestions(newSuggestions)
  }, [selectedFeatures, columns])

  const handleFeatureToggle = (featureName: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureName) ? prev.filter((f) => f !== featureName) : [...prev, featureName],
    )
  }

  const handleAnalysisTypeChange = (type: "univariate" | "bivariate" | "multivariate") => {
    setAnalysisType(type)
    setSelectedFeatures([])
    setSelectedVisualization("")
  }

  const getMaxFeatures = () => {
    switch (analysisType) {
      case "univariate":
        return 1
      case "bivariate":
        return 2
      case "multivariate":
        return 10
      default:
        return 1
    }
  }

  const canSelectFeature = (featureName: string) => {
    return selectedFeatures.length < getMaxFeatures() || selectedFeatures.includes(featureName)
  }

  const handleGenerateVisualization = () => {
    if (selectedVisualization && selectedFeatures.length > 0) {
      onVisualizationGenerate({
        type: selectedVisualization,
        features: selectedFeatures,
        analysisType,
      })
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "numerical":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "categorical":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "datetime":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-lg">Dataset Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.length}</div>
              <div className="text-sm text-gray-400">Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{columns.length}</div>
              <div className="text-sm text-gray-400">Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {columns.filter((col) => col.type === "numerical").length}
              </div>
              <div className="text-sm text-gray-400">Numerical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {columns.filter((col) => col.type === "categorical").length}
              </div>
              <div className="text-sm text-gray-400">Categorical</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Type Selection */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={analysisType} onValueChange={handleAnalysisTypeChange}>
            <TabsList className="grid w-full grid-cols-3 bg-[#252525]">
              <TabsTrigger value="univariate" className="data-[state=active]:bg-[#3b3b3b]">
                Univariate
              </TabsTrigger>
              <TabsTrigger value="bivariate" className="data-[state=active]:bg-[#3b3b3b]">
                Bivariate
              </TabsTrigger>
              <TabsTrigger value="multivariate" className="data-[state=active]:bg-[#3b3b3b]">
                Multivariate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="univariate" className="mt-4">
              <p className="text-sm text-gray-400">
                Analyze the distribution and characteristics of a single variable.
              </p>
            </TabsContent>
            <TabsContent value="bivariate" className="mt-4">
              <p className="text-sm text-gray-400">Explore relationships and patterns between two variables.</p>
            </TabsContent>
            <TabsContent value="multivariate" className="mt-4">
              <p className="text-sm text-gray-400">
                Examine complex relationships among multiple variables simultaneously.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature Selection */}
      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-lg">
            Feature Selection
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({selectedFeatures.length}/{getMaxFeatures()} selected)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {columns.map((column) => (
              <div
                key={column.name}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFeatures.includes(column.name)
                    ? "border-blue-500 bg-blue-500/10"
                    : canSelectFeature(column.name)
                      ? "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                      : "border-[#2a2a2a] bg-[#0a0a0a] opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canSelectFeature(column.name) && handleFeatureToggle(column.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{column.name}</span>
                  <Badge className={`text-xs ${getTypeColor(column.type)}`}>{column.type}</Badge>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Unique: {column.uniqueValues}</div>
                  {column.missingValues > 0 && <div className="text-yellow-400">Missing: {column.missingValues}</div>}
                  <div className="truncate">Sample: {column.sampleValues.slice(0, 3).join(", ")}...</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visualization Type Selection */}
      {selectedFeatures.length > 0 && (
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-lg">Visualization Type</CardTitle>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-gray-400">Recommended:</span>
                {suggestions.map((suggestion) => (
                  <Badge key={suggestion} variant="outline" className="text-xs">
                    {VISUALIZATION_TYPES[analysisType].find((v) => v.id === suggestion)?.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VISUALIZATION_TYPES[analysisType].map((viz) => {
                const Icon = viz.icon
                const isRecommended = suggestions.includes(viz.id)
                return (
                  <div
                    key={viz.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedVisualization === viz.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                    } ${isRecommended ? "ring-1 ring-green-500/30" : ""}`}
                    onClick={() => setSelectedVisualization(viz.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 mt-0.5 text-blue-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{viz.name}</span>
                          {isRecommended && (
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{viz.description}</p>
                        <div className="text-xs text-gray-500 mt-2">Requires: {viz.requires.join(" + ")}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {selectedVisualization && selectedFeatures.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={handleGenerateVisualization} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">
            Generate Visualization
          </Button>
        </div>
      )}
    </div>
  )
}
