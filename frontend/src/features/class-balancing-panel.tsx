//Himanshi's contribution for class imbalance analysis and balancing
"use client";

import { useState } from "react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { ArrowLeft } from "lucide-react";
export const BALANCING_METHODS = [
  "random_over",
  "random_under",
  "smote",
  "smote_tomek",
  "class_weight",
] as const;

export type BalancingMethod = typeof BALANCING_METHODS[number];

interface Props {
  onBack: () => void;
  onApply: (target: string, method: BalancingMethod) => void;
   onCheckImbalance: (target: string) => void;  
  classImbalance?: any;        
  columns: string[];
  disabled?: boolean;
}

export function ClassBalancingPanel({
  onBack,
  onApply,
  onCheckImbalance,
  classImbalance,
  columns,
  disabled = false,
  
}: Props) {
  const [target, setTarget] = useState("");
  const [method, setMethod] = useState<BalancingMethod>("random_over");


  const methods: { key: BalancingMethod; label: string }[] = [
    { key: "random_over", label: "Random Oversampling" },
    { key: "random_under", label: "Random Undersampling" },
    { key: "smote", label: "SMOTE" },
    { key: "smote_tomek", label: "SMOTE + Tomek" },
    { key: "class_weight", label: "Class Weights Only" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
      <Button
        variant="outline"
        onClick={onBack}
        className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h2 className="text-2xl font-bold mb-2">Class Balancing</h2>
      <p className="text-gray-400 mb-6">
        Handle class imbalance before model training.
      </p>

      <Card className="bg-[#121212] border-[#2a2a2a] mb-6">
        <CardHeader>
          <CardTitle>Select Target Column</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] p-2 rounded text-sm"
          >
            <option value="">Select target column</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="bg-[#121212] border-[#2a2a2a] mb-6">
        <CardHeader>
          <CardTitle>Choose Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {methods.map((m) => (
            <div
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`cursor-pointer border p-2 rounded text-sm transition ${
                method === m.key
                  ? "border-indigo-500 bg-[#111]"
                  : "border-[#2a2a2a] hover:bg-[#151515]"
              }`}
            >
              {m.label}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end mb-6">
        <Button
            variant="outline"
            disabled={!target || disabled}
            onClick={() => onCheckImbalance(target)}
            className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#222]"
        >Check Class Imbalance
        </Button>
        </div>

        {classImbalance?.results && (
        <Card className="bg-[#111] border-[#2a2a2a] mb-6">
            <CardHeader>
            <CardTitle>Class Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">

            <div>
                <strong>Total Samples:</strong>{" "}
                {classImbalance.results.total_samples}
            </div>

            <div>
                <strong>Imbalance Ratio:</strong>{" "}
                {Number(classImbalance.results.imbalance_ratio).toFixed(2)}
            </div>

            <div>
                <strong>Is Imbalanced:</strong>{" "}
                {classImbalance.results.is_imbalanced ? "Yes" : "No"}
            </div>

            <div className="mt-3">
                <strong>Class Distribution:</strong>
                <ul className="mt-2 space-y-1">
                {Object.entries(
                    classImbalance.results.class_distribution
                ).map(([label, count]) => (
                    <li key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span>{Number(count)}</span>
                    </li>
                ))}
                </ul>
            </div>

            </CardContent>
        </Card>
        )}
            <div className="flex justify-end">
        <Button
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={!target || disabled}
          onClick={() => onApply(target, method)}
        >
          Apply Balancing
        </Button>
      </div>
    </div>
  );
}
