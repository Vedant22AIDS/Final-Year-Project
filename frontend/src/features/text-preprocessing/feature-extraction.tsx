"use client";

import React, { useState } from "react";

type Method = "tfidf" | "bow" | "word2vec";

const FeatureExtraction = () => {
    const [method, setMethod] = useState<Method>("tfidf");
    const [maxFeatures, setMaxFeatures] = useState(1000);
    const [ngramRange, setNgramRange] = useState("1-1");
    const [vectorSize, setVectorSize] = useState(100);
    const [preview, setPreview] = useState<any>(null);

    const applyExtraction = () => {
        if (method === "tfidf") {
            setPreview({
                method: "TF-IDF",
                features: ["data", "model", "learning", "text"],
            });
        } else if (method === "bow") {
            setPreview({
                method: "Bag of Words",
                vocabularySize: maxFeatures,
                sample: [0, 1, 3, 0, 2],
            });
        } else {
            setPreview({
                method: "Word2Vec",
                vectorSize,
                exampleVector: Array(5).fill(0.23),
            });
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
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Feature Extraction</h1>
                <p className="text-sm text-gray-400">
                    Convert processed text into numerical representations for ML models.
                </p>
            </div>

            {/* Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        id: "tfidf",
                        title: "TF-IDF Vectorization",
                        desc: "Importance-based word representation",
                    },
                    {
                        id: "bow",
                        title: "Bag of Words (BoW)",
                        desc: "Frequency-based word counts",
                    },
                    {
                        id: "word2vec",
                        title: "Word Embeddings (Word2Vec)",
                        desc: "Dense semantic word vectors",
                    },
                ].map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setMethod(item.id as Method)}
                        className={`cursor-pointer p-5 rounded-xl border transition ${method === item.id
                                ? "border-blue-500 bg-neutral-900"
                                : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
                            }`}
                    >
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Configuration */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h2 className="text-lg font-medium mb-4">Configuration</h2>

                {method !== "word2vec" && (
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <label className="text-sm text-gray-300">
                                Max Features
                            </label>
                            <input
                                type="number"
                                value={maxFeatures}
                                onChange={(e) => setMaxFeatures(+e.target.value)}
                                className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-300">
                                N-gram Range
                            </label>
                            <select
                                value={ngramRange}
                                onChange={(e) => setNgramRange(e.target.value)}
                                className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                            >
                                <option>1-1</option>
                                <option>1-2</option>
                                <option>1-3</option>
                            </select>
                        </div>
                    </div>
                )}

                {method === "word2vec" && (
                    <div>
                        <label className="text-sm text-gray-300">
                            Vector Size
                        </label>
                        <input
                            type="number"
                            value={vectorSize}
                            onChange={(e) => setVectorSize(+e.target.value)}
                            className="block mt-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <div className="bg-black rounded p-3 text-xs text-gray-300 min-h-[100px]">
                    {preview ? JSON.stringify(preview, null, 2) : "No preview available"}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-neutral-800 rounded-md text-sm hover:bg-neutral-700"
                >
                    Reset
                </button>
                <button
                    onClick={applyExtraction}
                    className="px-5 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500"
                >
                    Apply Feature Extraction
                </button>
            </div>
        </div>
    );
};

export default FeatureExtraction;
