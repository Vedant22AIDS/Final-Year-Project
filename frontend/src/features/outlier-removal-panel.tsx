"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Checkbox } from "../components/ui/checkbox.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";

interface OutlierRemovalPanelProps {
  data: any[];
  onBack: () => void;
  onApply: (method: "iqr" | "zscore", columns: string[], threshold: number) => void;
  disabled?: boolean;
  dtypes?: Record<string, string>;
}

export function OutlierRemovalPanel({ data, onBack, onApply, disabled = false, dtypes = {} }: OutlierRemovalPanelProps) {
  const [method, setMethod] = useState<"iqr" | "zscore">("iqr");
  const [threshold, setThreshold] = useState("1.5");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const numericColumns = useMemo(() => {
    if (Object.keys(dtypes).length > 0) {
      return Object.entries(dtypes)
        .filter(([, dtype]) => {
          const value = String(dtype).toLowerCase();
          return value.includes("int") || value.includes("float") || value.includes("double") || value.includes("number");
        })
        .map(([name]) => name);
    }

    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((column) => {
      const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined && v !== "null");
      return values.length > 0 && values.every((v) => !isNaN(Number(v)));
    });
  }, [data, dtypes]);

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]));
  };

  const parsedThreshold = Number(threshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Remove Outliers</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-lg">Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Outlier detection method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as "iqr" | "zscore")}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="iqr">IQR</SelectItem>
                  <SelectItem value="zscore">Z-score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outlier-threshold">Threshold</Label>
              <Input
                id="outlier-threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a]"
              />
              <div className="text-xs text-gray-400">
                {method === "iqr" ? "Typical value: 1.5" : "Typical value: 3.0"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121212] border-[#2a2a2a] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Numeric Columns ({selectedColumns.length} selected)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedColumns(selectedColumns.length === numericColumns.length ? [] : [...numericColumns])}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
              >
                {selectedColumns.length === numericColumns.length ? "Deselect All" : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {numericColumns.length === 0 ? (
              <div className="text-sm text-gray-400">No numeric columns found in the current dataset.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {numericColumns.map((column) => (
                  <div
                    key={column}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedColumns.includes(column)
                        ? "border-red-500 bg-red-500/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox checked={selectedColumns.includes(column)} onCheckedChange={() => toggleColumn(column)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{column}</span>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Numeric</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => onApply(method, selectedColumns, parsedThreshold)}
          disabled={disabled || selectedColumns.length === 0 || !Number.isFinite(parsedThreshold) || parsedThreshold <= 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          <Play className="h-4 w-4 mr-2" />
          Remove Outliers
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setMethod("iqr");
            setThreshold("1.5");
            setSelectedColumns([]);
          }}
          disabled={disabled}
          className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a] px-8 py-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}

