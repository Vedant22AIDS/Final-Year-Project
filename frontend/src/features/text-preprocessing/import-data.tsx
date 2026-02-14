"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";

interface Props {
  onBack: () => void;
  onImport?: (payload: { text: string; fileName: string; charCount: number; wordCount: number; lineCount: number }) => void;
  disabled?: boolean;
}

const ImportTextData = ({ onBack, onImport, disabled = false }: Props) => {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split("\n").length;

  const handleFileUpload = async (file: File) => {
    const allowed = ["text/plain", "application/json"];
    if (!allowed.includes(file.type)) {
      alert("Only unstructured text files (.txt, .json) are allowed");
      return;
    }

    const content = await file.text();
    setText(content);
    setFileName(file.name);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] p-6 text-white">
      {/* Back */}
      <Button
        variant="outline"
        onClick={onBack}
        className="mb-4 bg-[#1e1e1e] border-[#2a2a2a]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Import Text Data</h1>
        <p className="text-sm text-gray-400">
          Upload or paste unstructured text for NLP preprocessing
        </p>
      </div>

      {/* Upload + Paste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload */}
        <Card className="bg-[#111] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Text File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".txt,.json,.md"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-medium
                         file:bg-[#1a1a1a] file:text-white
                         hover:file:bg-[#2a2a2a]"
            />

            {fileName && (
              <div className="mt-3 text-xs text-gray-400">
                Loaded: <span className="text-white">{fileName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paste */}
        <Card className="bg-[#111] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Raw Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste unstructured text here..."
              className="w-full h-40 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md p-3 text-sm resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Badge variant="outline">Characters: {charCount}</Badge>
        <Badge variant="outline">Words: {wordCount}</Badge>
        <Badge variant="outline">Lines: {lineCount}</Badge>
      </div>

      {/* Preview */}
      <Card className="bg-[#111] border-[#2a2a2a] mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
          {text
            ? text.slice(0, 1000)
            : "No text loaded yet"}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setText("");
            setFileName(null);
          }}
        >
          Reset
        </Button>

        <Button
          disabled={!text.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            onImport?.({
              text,
              fileName: fileName || "Pasted Text",
              charCount,
              wordCount,
              lineCount,
            });
            onBack();
          }}
        >
          Load Unstructured Dataset
        </Button>
      </div>
    </div>
  );
};

export default ImportTextData;
