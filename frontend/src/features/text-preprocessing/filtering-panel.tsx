"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";

interface FilteringPanelProps {
  onBack?: () => void;
  sourceText: string;
  onApply?: (config: {
    removeStopWords: boolean;
    minWordLength: number;
  }) => Promise<void> | void;
  disabled?: boolean;
}

const PREVIEW_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "if", "in", "into", "is",
  "it", "its", "of", "on", "or", "that", "the", "this", "to", "was", "were", "with",
]);

const WORD_TOKEN_REGEX = /[^\W_]+(?:'[^\W_]+)?/gu;

export default function FilteringPanel({
  onBack,
  sourceText,
  onApply,
  disabled = false,
}: FilteringPanelProps) {
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [minWordLength, setMinWordLength] = useState(1);

  const { originalTokens, filteredTokens } = useMemo(() => {
    const tokens = sourceText.match(WORD_TOKEN_REGEX) || [];
    const filtered = tokens.filter((token) => {
      if (removeStopWords && PREVIEW_STOP_WORDS.has(token.toLowerCase())) return false;
      return token.length >= minWordLength;
    });
    return { originalTokens: tokens, filteredTokens: filtered };
  }, [sourceText, removeStopWords, minWordLength]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4">
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

      <h2 className="text-2xl font-bold mb-1">Text Filtering</h2>
      <p className="text-gray-400 mb-6">
        Remove unnecessary tokens to improve text quality for NLP tasks.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-[#111] border-[#2a2a2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remove Stop Words</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Removes common words like "the", "is", "and"
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
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (Number.isNaN(parsed)) return;
                setMinWordLength(Math.max(1, Math.min(10, parsed)));
              }}
              className="w-20 px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-sm"
              disabled={disabled}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111] border-[#2a2a2a] mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 space-y-1">
          <div>
            Original -&gt;{" "}
            <code>[{originalTokens.slice(0, 20).map((token) => `"${token}"`).join(", ")}]</code>
          </div>
          <div>
            Filtered -&gt;{" "}
            <code>[{filteredTokens.slice(0, 20).map((token) => `"${token}"`).join(", ")}]</code>
          </div>
          <div className="text-gray-500">Min length &gt;= {minWordLength}</div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          className="bg-[#1a1a1a] border-[#2a2a2a]"
          onClick={() => {
            setRemoveStopWords(true);
            setMinWordLength(1);
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
          disabled={disabled || !sourceText.trim()}
        >
          Apply Filtering
        </Button>
      </div>
    </div>
  );
}
