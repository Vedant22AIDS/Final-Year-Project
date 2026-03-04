"use client";

import React, { useMemo, useState } from "react";

export type FeatureExtractionMethod = "tfidf" | "bow" | "word2vec";

export type FeatureExtractionConfig = {
  method: FeatureExtractionMethod;
  maxFeatures: number;
  ngramRange: string;
  vectorSize: number;
};

interface FeatureExtractionProps {
  sourceText: string;
  disabled?: boolean;
  onApply?: (config: FeatureExtractionConfig) => Promise<{ result: any } | void> | void;
}

const FeatureExtraction = ({ sourceText, disabled = false, onApply }: FeatureExtractionProps) => {
  const [method, setMethod] = useState<FeatureExtractionMethod>("tfidf");
  const [maxFeatures, setMaxFeatures] = useState(1000);
  const [ngramRange, setNgramRange] = useState("1-1");
  const [vectorSize, setVectorSize] = useState(100);
  const [preview, setPreview] = useState<any>(null);

  const sampleTokens = useMemo(() => (sourceText.match(/[^\W_]+(?:'[^\W_]+)?/gu) || []).slice(0, 12), [sourceText]);

  const applyExtraction = async () => {
    const result = await onApply?.({
      method,
      maxFeatures,
      ngramRange,
      vectorSize,
    });
    if (result && typeof result === "object" && "result" in result) {
      setPreview((result as any).result);
      return;
    }

    if (method === "word2vec") {
      setPreview([{ id: "1", values: Array.from({ length: 8 }, () => 0), metadata: { text: sourceText.slice(0, 120) } }]);
    } else {
      const values = Object.fromEntries(sampleTokens.map((t, i) => [t.toLowerCase(), method === "bow" ? (i % 3) + 1 : Number((1 / (i + 2)).toFixed(4))]));
      setPreview({ id: "doc1", values });
    }
  };

  const resetAll = () => {
    setPreview(null);
    setMaxFeatures(1000);
    setVectorSize(100);
    setNgramRange("1-1");
    setMethod("tfidf");
  };

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Feature Extraction</h1>
        <p className="text-sm text-gray-400">
          Convert processed text into numerical representations for ML models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "tfidf", title: "TF-IDF Vectorization", desc: "Importance-based word representation" },
          { id: "bow", title: "Bag of Words (BoW)", desc: "Frequency-based word counts" },
          { id: "word2vec", title: "Word Embeddings (Word2Vec)", desc: "Dense semantic word vectors" },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => !disabled && setMethod(item.id as FeatureExtractionMethod)}
            className={`cursor-pointer p-5 rounded-xl border transition ${method === item.id
              ? "border-blue-500 bg-neutral-900"
              : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h2 className="text-lg font-medium mb-4">Configuration</h2>

        {method !== "word2vec" && (
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="text-sm text-gray-300">Max Features</label>
              <input
                type="number"
                value={maxFeatures}
                min={10}
                max={10000}
                onChange={(e) => setMaxFeatures(Math.max(10, Math.min(10000, Number(e.target.value) || 10)))}
                className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">N-gram Range</label>
              <select
                value={ngramRange}
                onChange={(e) => setNgramRange(e.target.value)}
                className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                disabled={disabled}
              >
                <option value="1-1">1-1</option>
                <option value="1-2">1-2</option>
                <option value="1-3">1-3</option>
              </select>
            </div>
          </div>
        )}

        {method === "word2vec" && (
          <div>
            <label className="text-sm text-gray-300">Vector Size</label>
            <input
              type="number"
              value={vectorSize}
              min={10}
              max={1024}
              onChange={(e) => setVectorSize(Math.max(10, Math.min(1024, Number(e.target.value) || 10)))}
              className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium mb-2">Preview</h3>
        <div className="bg-black rounded p-3 text-xs text-gray-300 min-h-[100px] whitespace-pre-wrap break-all">
          {preview ? JSON.stringify(preview, null, 2) : "No preview available"}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={resetAll}
          className="px-4 py-2 bg-neutral-800 rounded-md text-sm hover:bg-neutral-700"
          disabled={disabled}
        >
          Reset
        </button>
        <button
          onClick={applyExtraction}
          className="px-5 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500"
          disabled={disabled || !sourceText.trim()}
        >
          Apply Feature Extraction
        </button>
      </div>
    </div>
  );
};

export default FeatureExtraction;
