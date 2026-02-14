"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";

import { ArrowLeft } from "lucide-react";

interface FilteringPanelProps {
    onBack?: () => void;
    onApply?: (config: {
        removeStopWords: boolean;
        minWordLength: number;
    }) => void;
    disabled?: boolean;
}

export default function FilteringPanel({
    onBack,
    onApply,
    disabled = false,
}: FilteringPanelProps) {
    const [removeStopWords, setRemoveStopWords] = useState(true);
    const [minWordLength, setMinWordLength] = useState(3);

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
            <h2 className="text-2xl font-bold mb-1">Text Filtering</h2>
            <p className="text-gray-400 mb-6">
                Remove unnecessary tokens to improve text quality for NLP tasks.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Stop Words */}
                <Card className="bg-[#111] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Remove Stop Words</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-400">
                            Removes common words like “the”, “is”, “and”
                        </p>
                        <input
                            type="checkbox"
                            checked={removeStopWords}
                            onChange={(e) => setRemoveStopWords(e.target.checked)}
                            className="h-4 w-4 accent-blue-500"
                            disabled={disabled}
                        />
                    </CardContent>
                </Card>

                {/* Minimum Word Length */}
                <Card className="bg-[#111] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Minimum Word Length</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <p className="text-xs text-gray-400 flex-1">
                            Filters out very short or noisy words
                        </p>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={minWordLength}
                            onChange={(e) => setMinWordLength(Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-sm"
                            disabled={disabled}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Preview */}
            <Card className="bg-[#111] border-[#2a2a2a] mb-6">
                <CardHeader>
                    <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-400 space-y-1">
                    <div>
                        Original →{" "}
                        <code>["this", "is", "a", "simple", "example"]</code>
                    </div>
                    <div>
                        Filtered →{" "}
                        <code>
                            {removeStopWords
                                ? `["simple", "example"]`
                                : `["this", "is", "a", "simple", "example"]`}
                        </code>
                    </div>
                    <div className="text-gray-500">
                        Min length ≥ {minWordLength}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    className="bg-[#1a1a1a] border-[#2a2a2a]"
                    onClick={() => {
                        setRemoveStopWords(true);
                        setMinWordLength(3);
                    }}
                    disabled={disabled}
                >
                    Reset
                </Button>

                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                        onApply?.({
                            removeStopWords,
                            minWordLength,
                        })
                    }
                    disabled={disabled}
                >
                    Apply Filtering
                </Button>
            </div>
        </div>
    );
}
