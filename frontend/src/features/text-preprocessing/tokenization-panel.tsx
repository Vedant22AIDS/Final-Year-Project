"use client"

import React, { useState } from "react"

interface TokenizationPanelProps {
    columns: string[]               // text columns from dataset
    onBack: () => void
    onApply: (config: any) => void  // later connect to backend
}

export default function TokenizationPanel({
    columns,
    onBack,
    onApply,
}: TokenizationPanelProps) {

    const [method, setMethod] = useState<"word" | "sentence" | "ngram">("word")
    const [selectedColumn, setSelectedColumn] = useState<string>("")
    const [nGramSize, setNGramSize] = useState<number>(2)
    const [lowercase, setLowercase] = useState<boolean>(true)
    const [removePunctuation, setRemovePunctuation] = useState<boolean>(true)

    const handleApply = () => {
        onApply({
            method,
            column: selectedColumn,
            nGramSize,
            lowercase,
            removePunctuation,
        })
    }

    return (
        <div className="flex flex-col h-full px-6 py-4 text-white">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={onBack}
                    className="mr-4 px-3 py-1 rounded-md bg-[#1e1e1e] hover:bg-[#2a2a2a]"
                >
                    ← Back
                </button>
                <h1 className="text-xl font-semibold">Text Tokenization</h1>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1">
                {/* Left Panel */}
                <div className="bg-[#111] rounded-xl p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-300">
                        Tokenization Method
                    </h2>

                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm"
                    >
                        <option value="word">Word Tokenization</option>
                        <option value="sentence">Sentence Tokenization</option>
                        <option value="ngram">N-Gram Tokenization</option>
                    </select>

                    {method === "ngram" && (
                        <div>
                            <label className="text-xs text-gray-400">N-Gram Size</label>
                            <input
                                type="number"
                                min={2}
                                max={5}
                                value={nGramSize}
                                onChange={(e) => setNGramSize(Number(e.target.value))}
                                className="w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-2 pt-2">
                        <label className="flex items-center space-x-2 text-xs">
                            <input
                                type="checkbox"
                                checked={lowercase}
                                onChange={() => setLowercase(!lowercase)}
                            />
                            <span>Convert to lowercase</span>
                        </label>

                        <label className="flex items-center space-x-2 text-xs">
                            <input
                                type="checkbox"
                                checked={removePunctuation}
                                onChange={() => setRemovePunctuation(!removePunctuation)}
                            />
                            <span>Remove punctuation</span>
                        </label>
                    </div>
                </div>

                {/* Middle Panel */}
                <div className="bg-[#111] rounded-xl p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-300">
                        Select Text Column
                    </h2>

                    {columns.length === 0 && (
                        <p className="text-xs text-gray-500">No text columns detected</p>
                    )}

                    {columns.map((col) => (
                        <button
                            key={col}
                            onClick={() => setSelectedColumn(col)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm border ${selectedColumn === col
                                    ? "border-blue-500 bg-[#1f2a3a]"
                                    : "border-[#2a2a2a] hover:bg-[#1e1e1e]"
                                }`}
                        >
                            {col}
                        </button>
                    ))}
                </div>

                {/* Right Panel */}
                <div className="bg-[#111] rounded-xl p-4 flex flex-col">
                    <h2 className="text-sm font-semibold text-gray-300 mb-2">
                        Preview (Sample Output)
                    </h2>

                    <div className="flex-1 bg-[#0d0d0d] rounded-md p-3 text-xs text-gray-400 overflow-auto">
                        <p>[ "This", "is", "a", "sample", "tokenized", "output" ]</p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-center gap-4 mt-6">
                <button
                    onClick={handleApply}
                    disabled={!selectedColumn}
                    className={`px-6 py-2 rounded-md text-sm ${selectedColumn
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-[#2a2a2a] cursor-not-allowed"
                        }`}
                >
                    ▶ Apply Tokenization
                </button>

                <button
                    onClick={() => {
                        setMethod("word")
                        setSelectedColumn("")
                        setNGramSize(2)
                        setLowercase(true)
                        setRemovePunctuation(true)
                    }}
                    className="px-6 py-2 rounded-md bg-[#1e1e1e] hover:bg-[#2a2a2a] text-sm"
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
