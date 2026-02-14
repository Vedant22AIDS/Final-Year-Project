"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
    onBack?: () => void;
    disabled?: boolean;
}

type EncodingType =
    | "label"
    | "onehot"
    | "frequency"
    | "target";

const OPTIONS = [
    {
        id: "label",
        title: "Label Encoding",
        desc: "Convert categories into numeric labels (0,1,2...)",
        example: `"Low","Medium","High" → 0,1,2`,
    },
    {
        id: "onehot",
        title: "One-Hot Encoding",
        desc: "Create binary columns for each category",
        example: `"Red","Blue" → Red=1 Blue=0`,
    },
    {
        id: "frequency",
        title: "Frequency Encoding",
        desc: "Replace category with its frequency",
        example: `"A"(40%) → 0.4`,
    },
    {
        id: "target",
        title: "Target Encoding",
        desc: "Encode category using target mean",
        example: `"City" → avg(label)`,
    },
] as const;

const LabelEncodingPanel = ({ onBack, disabled }: Props) => {
    const [selected, setSelected] = useState<EncodingType | null>(null);

    return (
        <div className="flex-1 overflow-y-auto bg-[#000] p-4 text-white">
            {/* Back */}
            <button
                onClick={onBack}
                className="mb-4 flex items-center gap-2 text-sm px-3 py-1 rounded-md border border-[#2a2a2a] hover:bg-[#1e1e1e]"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {/* Header */}
            <h1 className="text-2xl font-semibold mb-1">Label & Encoding</h1>
            <p className="text-gray-400 mb-6">
                Convert categorical variables into numerical format for machine learning.
            </p>

            {/* Encoding Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {OPTIONS.map((opt) => {
                    const active = selected === opt.id;
                    return (
                        <div
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            className={`cursor-pointer rounded-xl border p-5 transition ${active
                                    ? "border-blue-500 bg-[#111]"
                                    : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#151515]"
                                }`}
                        >
                            <h3 className="font-medium">{opt.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                            <p className="text-xs text-blue-400 mt-2">{opt.example}</p>
                        </div>
                    );
                })}
            </div>

            {/* Preview */}
            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 mb-6">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <div className="text-xs text-gray-400 space-y-1">
                    <div>
                        Original → <code>["Red","Blue","Red"]</code>
                    </div>
                    <div>
                        Encoded →{" "}
                        <code>
                            {selected === "label" && "[0,1,0]"}
                            {selected === "onehot" && "[Red=1 Blue=0]"}
                            {selected === "frequency" && "[0.66,0.33]"}
                            {selected === "target" && "[0.72,0.41]"}
                            {!selected && "Select encoding method"}
                        </code>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-sm hover:bg-[#2a2a2a]"
                >
                    Reset
                </button>

                <button
                    disabled={!selected || disabled}
                    className="px-5 py-2 rounded-md bg-blue-600 text-sm hover:bg-blue-500 disabled:opacity-50"
                >
                    Apply Encoding
                </button>
            </div>
        </div>
    );
};

export default LabelEncodingPanel;
