"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button.tsx";
import { useApi, type DimensionalityReductionResponse, type DimensionalityTechnique } from "../hooks/use-api.ts";

interface PcaPanelProps {
  datasetId: string | null;
  fileName?: string;
  onTechniqueApplied?: (result: DimensionalityReductionResponse) => void;
  onBack: () => void;
  disabled?: boolean;
}

export default function PcaPanel({ datasetId, fileName, onTechniqueApplied, onBack, disabled = false }: PcaPanelProps) {
  const api = useApi();
  const [technique, setTechnique] = useState<DimensionalityTechnique>("pca");
  const [nComponents, setNComponents] = useState<number>(2);
  const [scaleData, setScaleData] = useState<boolean>(true);
  const [randomState, setRandomState] = useState<number>(42);
  const [perplexity, setPerplexity] = useState<number>(30);
  const [nNeighbors, setNNeighbors] = useState<number>(15);
  const [result, setResult] = useState<DimensionalityReductionResponse | null>(null);
  const [running, setRunning] = useState(false);

  const canRun = useMemo(() => !!datasetId && !running && !disabled, [datasetId, running, disabled]);
  const outputColumns = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.column_names) && result.column_names.length > 0) {
      return result.column_names;
    }
    const firstRow = result.transformed_data?.[0];
    return firstRow ? Object.keys(firstRow) : [];
  }, [result]);

  const onRun = async () => {
    if (!datasetId) {
      toast.error("Please load a dataset first");
      return;
    }

    setRunning(true);
    try {
      const payload = {
        technique,
        n_components: nComponents,
        scale_data: scaleData,
        random_state: randomState,
        perplexity,
        n_neighbors: nNeighbors,
      };

      const response = await api.runDimensionalityReduction(datasetId, payload);
      setResult(response);
      onTechniqueApplied?.(response);
      toast.success(`${technique.toUpperCase()} dimensionality reduction applied successfully!`);
    } catch (err) {
      toast.error(`Error applying ${technique.toUpperCase()}: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[#1e1e1e] rounded-md transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">Dimensionality Reduction</h2>
            <p className="text-xs text-gray-400">Reduce feature dimensions for visualization or analysis</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-5">
        {/* Technique Selection */}
        <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
          <label className="block text-sm font-medium mb-3">Select Technique</label>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value as DimensionalityTechnique)}
            disabled={running}
            className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="pca">PCA (Principal Component Analysis)</option>
            <option value="svd">Truncated SVD</option>
            <option value="tsne">t-SNE (2D Visualization)</option>
            <option value="umap">UMAP (if available)</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">
            {technique === "pca" && "Reduces dimensionality while preserving maximum variance"}
            {technique === "svd" && "Uses singular value decomposition for dimensionality reduction"}
            {technique === "tsne" && "Creates 2D visualization by minimizing KL divergence"}
            {technique === "umap" && "Preserves both local and global structure in lower dimensions"}
          </p>
        </div>

        {/* Common Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* n_components */}
          <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
            <label className="block text-sm font-medium mb-2">Number of Components</label>
            <input
              type="number"
              value={nComponents}
              onChange={(e) => setNComponents(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={running}
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">Choose output dimensions (2-3 recommended for visualization)</p>
          </div>

          {/* Scale Data */}
          <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d] flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Scale Data</label>
              <p className="text-xs text-gray-400 mt-1">Normalize features to zero mean and unit variance</p>
            </div>
            <input
              type="checkbox"
              checked={scaleData}
              onChange={(e) => setScaleData(e.target.checked)}
              disabled={running}
              className="w-5 h-5 accent-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Algorithm-Specific Parameters */}
        {(technique === "tsne" || technique === "pca" || technique === "svd") && (
          <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
            <label className="block text-sm font-medium mb-3">Random State</label>
            <input
              type="number"
              value={randomState}
              onChange={(e) => setRandomState(parseInt(e.target.value) || 42)}
              disabled={running}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">Seed for reproducibility</p>
          </div>
        )}

        {technique === "tsne" && (
          <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
            <label className="block text-sm font-medium mb-2">Perplexity</label>
            <input
              type="number"
              value={perplexity}
              onChange={(e) => setPerplexity(Math.max(1, parseFloat(e.target.value) || 30))}
              disabled={running}
              min="1"
              max="100"
              step="1"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">Controls balance between local and global structure (typically 5-50)</p>
          </div>
        )}

        {technique === "umap" && (
          <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
            <label className="block text-sm font-medium mb-2">Number of Neighbors</label>
            <input
              type="number"
              value={nNeighbors}
              onChange={(e) => setNNeighbors(Math.max(1, parseInt(e.target.value) || 15))}
              disabled={running}
              min="1"
              max="200"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">Size of local neighborhood (typically 5-50)</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-[#161b22] rounded-lg p-4 border border-green-500/20">
            <h3 className="text-sm font-medium mb-3 text-green-400">✓ Results</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">Input Shape</p>
                <p className="font-medium">{result.input_shape.rows} rows × {result.input_shape.columns} cols</p>
              </div>
              <div>
                <p className="text-gray-400">Technique</p>
                <p className="font-medium">{result.technique.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-gray-400">Output Columns</p>
                <p className="font-medium">{outputColumns.length ? outputColumns.join(", ") : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Output File</p>
                <p className="font-medium">{result.output_file}</p>
              </div>
            </div>

            {/* 1. Show transformed dataset after PCA */}
            {result.transformed_data && (
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">Transformed Dataset (first 5 rows)</p>
                <div className="overflow-x-auto">
                  <table className="min-w-max text-xs border border-[#30363d] rounded">
                    <thead>
                      <tr>
                        {outputColumns.map(col => (
                          <th key={col} className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.transformed_data.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {outputColumns.map(col => (
                            <td key={col} className="px-2 py-1 border-b border-[#30363d]">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Explained variance ratio for each component */}
            {result.explained_variance_ratio && (
              <div className="mt-3 pt-3 border-t border-[#30363d]">
                <p className="text-gray-400 text-xs mb-2">Explained Variance Ratio</p>
                <div className="space-y-1">
                  {result.explained_variance_ratio.map((variance, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 min-w-max">PC{i + 1}:</span>
                      <div className="flex-1 bg-[#0d1117] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(variance * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 min-w-max">{(variance * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                {/* 3. Summarize how many components are needed to capture most of the variance */}
                {result.cumulative_variance && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-300">
                      Cumulative variance: {(result.cumulative_variance[result.cumulative_variance.length - 1] * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {(() => {
                        const threshold = 0.95;
                        const idx = result.cumulative_variance.findIndex(v => v >= threshold);
                        if (idx !== -1) {
                          return `At least ${idx + 1} component(s) capture ≥95% of variance.`;
                        }
                        return `All components together capture ${(result.cumulative_variance[result.cumulative_variance.length - 1] * 100).toFixed(1)}% variance.`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. Compare original features with PCA components */}
            {result.numeric_columns && (
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">Original Features vs PCA Components</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-300 mb-1">Original Features:</p>
                    <ul className="list-disc list-inside text-xs text-gray-200">
                      {result.numeric_columns.map(col => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 mb-1">PCA Components:</p>
                    <ul className="list-disc list-inside text-xs text-gray-200">
                      {outputColumns.map(col => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  PCA transforms the original features into new uncorrelated components (PC1, PC2, ...), each capturing a portion of the total variance. The new components are linear combinations of the original features.
                </p>
              </div>
            )}

            {/* 5. Iris dataset illustration */}
            <div className="mt-6">
              <p className="text-gray-400 text-xs mb-2">Example: Iris Dataset Before and After PCA</p>
              <div className="overflow-x-auto">
                <table className="min-w-max text-xs border border-[#30363d] rounded mb-2">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">SepalLength</th>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">SepalWidth</th>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">PetalLength</th>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">PetalWidth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>5.1</td><td>3.5</td><td>1.4</td><td>0.2</td></tr>
                    <tr><td>4.9</td><td>3.0</td><td>1.4</td><td>0.2</td></tr>
                    <tr><td>4.7</td><td>3.2</td><td>1.3</td><td>0.2</td></tr>
                    <tr><td>4.6</td><td>3.1</td><td>1.5</td><td>0.2</td></tr>
                    <tr><td>5.0</td><td>3.6</td><td>1.4</td><td>0.2</td></tr>
                  </tbody>
                </table>
                <table className="min-w-max text-xs border border-[#30363d] rounded">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">PC1</th>
                      <th className="px-2 py-1 border-b border-[#30363d] text-left text-gray-300">PC2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>-2.684</td><td>0.319</td></tr>
                    <tr><td>-2.715</td><td>-0.169</td></tr>
                    <tr><td>-2.889</td><td>-0.137</td></tr>
                    <tr><td>-2.746</td><td>0.505</td></tr>
                    <tr><td>-2.728</td><td>0.313</td></tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-2">
                  The PCA components (PC1, PC2) are linear combinations of the original features and capture most of the variance in the dataset.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#30363d] px-6 py-4 flex gap-2 justify-end">
        <Button variant="outline" onClick={onBack} disabled={running}>
          Cancel
        </Button>
        <Button onClick={onRun} disabled={!canRun}>
          {running ? "Running..." : `Run ${technique.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
