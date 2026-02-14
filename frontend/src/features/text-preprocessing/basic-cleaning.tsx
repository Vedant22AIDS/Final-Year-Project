"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export type CleaningOption =
  | "remove_html"
  | "remove_urls"
  | "remove_special_chars"
  | "normalize_case"
  | "remove_whitespace";

interface Props {
  onBack?: () => void;
  sourceText?: string;
  onApply?: (options: CleaningOption[]) => Promise<{ cleanedText: string } | void> | void;
  disabled?: boolean;
}

const OPTIONS = [
  {
    id: "remove_html",
    title: "Remove HTML / XML tags",
    desc: "Strip HTML and XML tags from text",
  },
  {
    id: "remove_urls",
    title: "Remove URLs & Emails",
    desc: "Delete URLs and email addresses",
  },
  {
    id: "remove_special_chars",
    title: "Remove Special Characters",
    desc: "Keep only alphanumeric characters",
  },
  {
    id: "normalize_case",
    title: "Normalize Case",
    desc: "Convert text to lowercase",
  },
  {
    id: "remove_whitespace",
    title: "Remove Extra Whitespace",
    desc: "Trim and normalize spaces",
  },
] as const;

const BasicCleaning = ({ onBack, sourceText = "", onApply, disabled }: Props) => {
  const [selected, setSelected] = useState<CleaningOption[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [preview, setPreview] = useState({
    original: sourceText,
    cleaned: sourceText,
  });

  useEffect(() => {
    setPreview({ original: sourceText, cleaned: sourceText });
  }, [sourceText]);

  const toggle = (id: CleaningOption) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => {
    setSelected([]);
    setPreview({ original: sourceText, cleaned: sourceText });
  };

  const handleApply = async () => {
    if (!onApply || selected.length === 0) return;
    try {
      setIsApplying(true);
      const result = await onApply(selected);
      if (result?.cleanedText !== undefined) {
        setPreview({ original: sourceText, cleaned: result.cleanedText });
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-4 text-white">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm px-3 py-1 rounded-md border border-[#2a2a2a] hover:bg-[#1e1e1e]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-semibold mb-1">Basic Text Cleaning</h1>
      <p className="text-gray-400 mb-6">Apply basic preprocessing operations to clean raw text data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {OPTIONS.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <div
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`cursor-pointer rounded-xl border p-5 transition ${
                active ? "border-blue-500 bg-[#111]" : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#151515]"
              }`}
            >
              <h3 className="font-medium">{opt.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-medium mb-2">Preview</h3>
        <div className="text-xs text-gray-400 space-y-2">
          <div>Original:</div>
          <code className="block bg-[#0b0b0b] border border-[#2a2a2a] rounded-md p-2 max-h-28 overflow-y-auto whitespace-pre-wrap">
            {preview.original.trim() ? preview.original.slice(0, 600) : "No source text loaded. Import unstructured text first."}
          </code>
          <div>Cleaned:</div>
          <code className="block bg-[#0b0b0b] border border-[#2a2a2a] rounded-md p-2 max-h-28 overflow-y-auto whitespace-pre-wrap">
            {preview.cleaned.trim() ? preview.cleaned.slice(0, 600) : "No cleaning applied yet."}
          </code>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-sm hover:bg-[#2a2a2a]"
        >
          Reset
        </button>

        <button
          disabled={selected.length === 0 || disabled || isApplying}
          className="px-5 py-2 rounded-md bg-blue-600 text-sm hover:bg-blue-500 disabled:opacity-50"
          onClick={handleApply}
        >
          {isApplying ? "Applying..." : "Apply Cleaning"}
        </button>
      </div>
    </div>
  );
};

export default BasicCleaning;
