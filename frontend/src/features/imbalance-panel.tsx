"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "../components/ui/button.tsx";

interface ImbalancePanelProps {
  datasetId: string | null;
  fileName?: string;
  onTechniqueApplied?: (result: { technique: string; downloadId: string; outputFile: string }) => void;
  onBack: () => void;
  disabled?: boolean;
}

export default function ImbalancePanel({ datasetId, fileName, onBack }: ImbalancePanelProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
      <Button variant="outline" onClick={onBack} className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Overview
      </Button>

      <h2 className="text-2xl font-bold mb-2">Imbalanced Dataset Handling</h2>
      <p className="text-gray-400">
        Imbalance panel is available. Active dataset: <span className="text-blue-400">{fileName || "Not selected"}</span>
      </p>
      {!datasetId && <p className="text-sm text-yellow-400 mt-3">Import CSV/Excel dataset first.</p>}
    </div>
  );
}

