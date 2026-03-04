"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";

export interface TextNormalizationConfig {
  method: "stemming" | "lemmatization" | "spell-correction";
  stemmingAlgorithm: "porter" | "snowball";
}

interface TextNormalizationPanelProps {
  onBack?: () => void;
  sourceText: string;
  onApply?: (config: TextNormalizationConfig) => Promise<void> | void;
  disabled?: boolean;
}

const WORD_TOKEN_REGEX = /[^\W_]+(?:'[^\W_]+)?/gu;
const LEMMA_MAP: Record<string, string> = {
  running: "run",
  better: "good",
  children: "child",
  went: "go",
  was: "be",
  were: "be",
};
const SPELLING_MAP: Record<string, string> = {
  speling: "spelling",
  eror: "error",
  langauge: "language",
  recieve: "receive",
  seperate: "separate",
  helllo: "hello",
};

// Common misspellings to cover frequent errors (example list provided by user)
const COMMON_MISSPELLINGS: Record<string, string> = {
  definately: "definitely",
  occured: "occurred",
  untill: "until",
  wich: "which",
  becuase: "because",
  adress: "address",
  enviroment: "environment",
  goverment: "government",
  accomodate: "accommodate",
  calender: "calendar",
  concious: "conscious",
  dependant: "dependent",
  embarass: "embarrass",
  existance: "existence",
  foriegn: "foreign",
  happend: "happened",
  immediatly: "immediately",
  independant: "independent",
};

const SPELLING_VOCAB = new Set<string>(["hello", "language", "error", "receive", "separate", "spelling"]);

const stemToken = (token: string, algorithm: "porter" | "snowball"): string => {
  const lower = token.toLowerCase();
  if (lower.length <= 3) return token;
  let stem = lower;
  if (stem.endsWith("ies") && stem.length > 4) {
    stem = stem.slice(0, -3) + "y";
  } else if (stem.endsWith("ing") && stem.length > 5) {
    stem = stem.slice(0, -3);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && !"lsz".includes(stem[stem.length - 1])) {
      stem = stem.slice(0, -1);
    }
  } else if (stem.endsWith("ed") && stem.length > 4) {
    stem = stem.slice(0, -2);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && !"lsz".includes(stem[stem.length - 1])) {
      stem = stem.slice(0, -1);
    }
  } else if (algorithm === "snowball" && stem.endsWith("ly") && stem.length > 4) {
    stem = stem.slice(0, -2);
  }
  return stem;
};

const normalizeToken = (
  token: string,
  method: TextNormalizationConfig["method"],
  stemmingAlgorithm: TextNormalizationConfig["stemmingAlgorithm"]
) => {
  const lower = token.toLowerCase();
  if (method === "stemming") return stemToken(token, stemmingAlgorithm);
  if (method === "lemmatization") {
    if (LEMMA_MAP[lower]) return LEMMA_MAP[lower];
    if (lower.endsWith("ies") && lower.length > 4) return lower.slice(0, -3) + "y";
    if (lower.endsWith("s") && lower.length > 4 && !lower.endsWith("ss") && !lower.endsWith("us") && !lower.endsWith("is")) {
      return lower.slice(0, -1);
    }
    return token;
  }
  if (SPELLING_MAP[lower]) return SPELLING_MAP[lower];
  if (COMMON_MISSPELLINGS[lower]) return COMMON_MISSPELLINGS[lower];
  if (SPELLING_VOCAB.has(lower)) return token;
  const squashed = lower.replace(/(.)\1{2,}/g, "$1$1");
  if (SPELLING_VOCAB.has(squashed)) return squashed;
  return token;
};

export default function TextNormalizationPanel({
  onBack,
  sourceText,
  onApply,
  disabled = false,
}: TextNormalizationPanelProps) {
  const [method, setMethod] = useState<TextNormalizationConfig["method"]>("stemming");
  const [stemmingAlgorithm, setStemmingAlgorithm] = useState<TextNormalizationConfig["stemmingAlgorithm"]>("porter");

  const { originalTokens, normalizedTokens } = useMemo(() => {
    const tokens = sourceText.match(WORD_TOKEN_REGEX) || [];
    const normalized = tokens.map((token) => normalizeToken(token, method, stemmingAlgorithm));
    return { originalTokens: tokens, normalizedTokens: normalized };
  }, [sourceText, method, stemmingAlgorithm]);

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

      <h2 className="text-2xl font-bold mb-1">Text Normalization</h2>
      <p className="text-gray-400 mb-6">
        Normalize words into base or corrected forms for better NLP accuracy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { key: "stemming" as const, title: "Stemming", desc: "Reduce words to root form" },
          { key: "lemmatization" as const, title: "Lemmatization", desc: "Convert words to dictionary form" },
          { key: "spell-correction" as const, title: "Spell Correction", desc: "Fix spelling mistakes automatically" },
        ].map((item) => (
          <Card
            key={item.key}
            onClick={() => setMethod(item.key)}
            className={`cursor-pointer border transition ${method === item.key
              ? "border-blue-500 bg-[#111]"
              : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#151515]"
              }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400">{item.desc}</CardContent>
          </Card>
        ))}
      </div>

      {method === "stemming" && (
        <Card className="bg-[#111] border-[#2a2a2a] mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Stemming Algorithm</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {(["porter", "snowball"] as const).map((algo) => (
              <label
                key={algo}
                className={`flex items-center gap-2 text-sm cursor-pointer ${stemmingAlgorithm === algo ? "text-blue-400" : "text-gray-400"}`}
              >
                <input
                  type="radio"
                  name="stemmingAlgo"
                  value={algo}
                  checked={stemmingAlgorithm === algo}
                  onChange={() => setStemmingAlgorithm(algo)}
                  disabled={disabled}
                />
                {algo === "porter" ? "Porter Stemmer" : "Snowball Stemmer"}
              </label>
            ))}
          </CardContent>
        </Card>
      )}

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
            Normalized -&gt;{" "}
            <code>[{normalizedTokens.slice(0, 20).map((token) => `"${token}"`).join(", ")}]</code>
          </div>
        </CardContent>
      </Card>

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
          onClick={() => onApply?.({ method, stemmingAlgorithm })}
          disabled={disabled || !sourceText.trim()}
        >
          Apply Normalization
        </Button>
      </div>
    </div>
  );
}
