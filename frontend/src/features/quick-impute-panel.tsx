"use client";

import { useState } from "react";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Label } from "../components/ui/label.tsx";
import { Input } from "../components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";

interface QuickImputePanelProps {
  onBack: () => void;
  onApply: (strategy: string, fillValue?: string) => void;
  disabled?: boolean;
}

export function QuickImputePanel({ onBack, onApply, disabled = false }: QuickImputePanelProps) {
  const [strategy, setStrategy] = useState("mean");
  const [fillValue, setFillValue] = useState("");

  const strategyOptions = [
    { value: "mean", label: "Mean" },
    { value: "median", label: "Median" },
    { value: "mode", label: "Mode" },
    { value: "constant", label: "Constant value" },
    { value: "forward_fill", label: "Forward fill" },
    { value: "backward_fill", label: "Backward fill" },
    { value: "remove", label: "Remove rows with missing values" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Quick Impute</h2>
      </div>

      <Card className="bg-[#121212] border-[#2a2a2a] max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Apply to entire dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {strategyOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {strategy === "constant" && (
            <div className="space-y-2">
              <Label htmlFor="quick-fill-value">Fill value</Label>
              <Input
                id="quick-fill-value"
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                placeholder="Enter value"
                className="bg-[#1a1a1a] border-[#2a2a2a]"
              />
            </div>
          )}

          <div className="text-xs text-gray-400">
            Quick Impute processes all columns at once. Use Advanced Imputation for per-column control.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => onApply(strategy, strategy === "constant" ? fillValue : undefined)}
          disabled={disabled || (strategy === "constant" && fillValue.trim() === "")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          <Play className="h-4 w-4 mr-2" />
          Apply Quick Impute
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setStrategy("mean");
            setFillValue("");
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

