"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { ArrowLeft } from "lucide-react";

interface TextNormalizationConfig {
    method: "stemming" | "lemmatization" | "spell-correction";
    stemmingAlgorithm: "porter" | "snowball";
}

interface TextNormalizationPanelProps {
    onBack?: () => void;
    onApply?: (config: TextNormalizationConfig) => void;
    disabled?: boolean;
}

export default function TextNormalizationPanel({
    onBack,
    onApply,
    disabled = false,
}: TextNormalizationPanelProps) {
    const [method, setMethod] = useState<TextNormalizationConfig["method"]>("stemming");
    const [stemmingAlgorithm, setStemmingAlgorithm] =
        useState<TextNormalizationConfig["stemmingAlgorithm"]>("porter");

    return (
        <div className="flex-1 overflow-y-auto bg-[#000] p-4">
            {/* Back */}
            {onBack && (
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="mb-4 bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold mb-1">Text Normalization</h2>
            <p className="text-gray-400 mb-6">
                Normalize words into their base or corrected form for better NLP accuracy.
            </p>

            {/* Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    {
                        key: "stemming",
                        title: "Stemming",
                        desc: "Reduce words to root form",
                    },
                    {
                        key: "lemmatization",
                        title: "Lemmatization",
                        desc: "Convert words to dictionary form",
                    },
                    {
                        key: "spell-correction",
                        title: "Spell Correction",
                        desc: "Fix spelling mistakes automatically",
                    },
                ].map((item) => (
                    <Card
                        key={item.key}
                        onClick={() => setMethod(item.key as any)}
                        className={`cursor-pointer border transition ${method === item.key
                            ? "border-blue-500 bg-[#111]"
                            : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#151515]"
                            }`}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-400">
                            {item.desc}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stemming Options */}
            {method === "stemming" && (
                <Card className="bg-[#111] border-[#2a2a2a] mb-6">
                    <CardHeader>
                        <CardTitle className="text-sm">Stemming Algorithm</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        {["porter", "snowball"].map((algo) => (
                            <label
                                key={algo}
                                className={`flex items-center gap-2 text-sm cursor-pointer ${stemmingAlgorithm === algo
                                    ? "text-blue-400"
                                    : "text-gray-400"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="stemmingAlgo"
                                    value={algo}
                                    checked={stemmingAlgorithm === algo}
                                    onChange={() => setStemmingAlgorithm(algo as any)}
                                    disabled={disabled}
                                />
                                {algo === "porter" ? "Porter Stemmer" : "Snowball Stemmer"}
                            </label>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Preview */}
            <Card className="bg-[#111] border-[#2a2a2a] mb-6">
                <CardHeader>
                    <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-400 space-y-1">
                    {method === "stemming" && (
                        <>
                            <div>Original → <code>["running", "played", "easily"]</code></div>
                            <div>Stemmed → <code>["run", "play", "easi"]</code></div>
                        </>
                    )}
                    {method === "lemmatization" && (
                        <>
                            <div>Original → <code>["running", "better", "children"]</code></div>
                            <div>Lemmatized → <code>["run", "good", "child"]</code></div>
                        </>
                    )}
                    {method === "spell-correction" && (
                        <>
                            <div>Original → <code>["speling", "eror", "langauge"]</code></div>
                            <div>Corrected → <code>["spelling", "error", "language"]</code></div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    className="bg-[#1a1a1a] border-[#2a2a2a]"
                    onClick={() => {
                        setMethod("stemming");
                        setStemmingAlgorithm("porter");
                    }}
                    disabled={disabled}
                >
                    Reset
                </Button>

                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                        onApply?.({
                            method,
                            stemmingAlgorithm,
                        })
                    }
                    disabled={disabled}
                >
                    Apply Normalization
                </Button>
            </div>
        </div>
    );
}
