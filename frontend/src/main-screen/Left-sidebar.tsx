"use client";

import * as React from "react";
import { useState } from "react";
import { ScrollArea } from "../components/ui/ScrollArea.tsx";

interface LeftSidebarProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImputeMissingValues: () => void;
  onQuickImputeClick?: () => void;
  onAdvancedImputationClick?: () => void;
  onVisualizationClick: () => void;
  onDataSummaryClick: () => void;
  onCorrelationAnalysisClick: () => void;
  onPcaClick?: () => void;
  onMissingValuesClick?: () => void;
  onDatabaseConnectorsClick?: () => void;
  onNormalizationClick?: () => void;
  onOutliersClick?: () => void;
  onClassBalancingClick?: () => void;
  onSaveProjectClick?: () => void;
  disabled?: boolean;

  /* New optional handlers for expanded feature set */
  onValidationClick?: () => void;
  onExportClick?: () => void;

  /* Text Preprocessing handlers */
  onImportTextDataClick?: () => void;
  onLabelEncodingClick?: () => void;
  onFeatureExtractionClick?: () => void;
  onTextPreprocessingClick?: () => void;
  onTokenizationClick?: () => void;
  // Text Preprocessing – Normalization
  onTextNormalizationClick?: () => void;

  // Category 1: Basic Text Cleaning
  onRemoveHTMLClick?: () => void;
  onBasicCleaningClick?: () => void
  onRemoveURLsClick?: () => void;
  onRemoveSpecialCharsClick?: () => void;
  onNormalizeCaseClick?: () => void;
  onRemoveWhitespaceClick?: () => void;
  // Category 2: Tokenization
  onWordTokenizeClick?: () => void;
  onSentenceTokenizeClick?: () => void;
  onNGramClick?: () => void;
  // Category 3: Stop Words
  onRemoveStopWordsClick?: () => void;
  onMinWordLengthClick?: () => void;
  // Category 4: Normalization
  onStemmingClick?: () => void;
  onLemmatizationClick?: () => void;
  onSpellCorrectionClick?: () => void;
  // Category 5: Feature Extraction
  onTFIDFClick?: () => void;
  onBagOfWordsClick?: () => void;
  onWordEmbeddingsClick?: () => void;
  // Category 6: Language & Encoding
  onLanguageDetectionClick?: () => void;
  onTranslationClick?: () => void;
  onEncodingNormalizationClick?: () => void;
  // Category 9: Text Statistics
  onWordFrequencyClick?: () => void;
  onTextStatsClick?: () => void;
  onSentimentAnalysisClick?: () => void;
  dataKind?: "none" | "structured" | "unstructured";
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  collapsed: boolean;
}

/* CollapsibleSection: same UX as your original but modular */
function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  disabled = false,
  collapsed,
}: CollapsibleSectionProps) {
  // collapsed minimal button with tooltip
  if (collapsed) {
    return (
      <div className="mb-1 flex justify-center">
        <button
          onClick={() => {
            if (!disabled) onToggle();
          }}
          disabled={disabled}
          title={title}
          className={`flex items-center justify-center p-2 rounded-md transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
            }`}
        >
          {icon}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-xl border border-[#1a1a1a] bg-[#070707] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#101010]"
          }`}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2 text-slate-200">{title}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="ls-section-body pl-3 pr-2 py-2 space-y-1 border-t border-[#141414] bg-[#050505]">{children}</div>}
    </div>
  );
}

/* LeftSidebar: extended with many non-repetitive features */
export function LeftSidebar({
  handleFileUpload,
  handleImputeMissingValues,
  onQuickImputeClick,
  onAdvancedImputationClick,
  onVisualizationClick,
  onDataSummaryClick,
  onCorrelationAnalysisClick,
  onPcaClick,
  onMissingValuesClick,
  onDatabaseConnectorsClick,
  onNormalizationClick,
  onOutliersClick,
  onClassBalancingClick,
  onSaveProjectClick,
  disabled = false,

  // new optional handlers (safe defaults used inside)
  onValidationClick,
  onExportClick,

  // text preprocessing handlers
  onImportTextDataClick,
  onLabelEncodingClick,
  onFeatureExtractionClick,
  onTextNormalizationClick,
  onTextPreprocessingClick,
  onBasicCleaningClick,
  onTokenizationClick,
  onRemoveHTMLClick,
  onRemoveURLsClick,
  onRemoveSpecialCharsClick,
  onNormalizeCaseClick,
  onRemoveWhitespaceClick,
  onWordTokenizeClick,
  onSentenceTokenizeClick,
  onNGramClick,
  onRemoveStopWordsClick,
  onMinWordLengthClick,
  onStemmingClick,
  onLemmatizationClick,
  onSpellCorrectionClick,
  onTFIDFClick,
  onBagOfWordsClick,
  onWordEmbeddingsClick,
  onLanguageDetectionClick,
  onTranslationClick,
  onEncodingNormalizationClick,
  onWordFrequencyClick,
  onTextStatsClick,
  onSentimentAnalysisClick,
  dataKind = "none",

}: LeftSidebarProps) {
  const noop = () => { };
  onQuickImputeClick = onQuickImputeClick ?? handleImputeMissingValues;
  onAdvancedImputationClick = onAdvancedImputationClick ?? onMissingValuesClick ?? noop;
  onPcaClick = onPcaClick ?? noop;
  onDatabaseConnectorsClick = onDatabaseConnectorsClick ?? noop;
  onOutliersClick = onOutliersClick ?? noop;
  onClassBalancingClick = onClassBalancingClick ?? noop;
  onSaveProjectClick = onSaveProjectClick ?? noop;
  // ensure handlers exist
  onValidationClick = onValidationClick ?? noop;
  onExportClick = onExportClick ?? noop;

  // text preprocessing handlers
  onImportTextDataClick = onImportTextDataClick ?? noop;
  onLabelEncodingClick = onLabelEncodingClick ?? noop;
  onFeatureExtractionClick = onFeatureExtractionClick ?? noop;
  onTextNormalizationClick = onTextNormalizationClick ?? noop;
  onTextPreprocessingClick = onTextPreprocessingClick ?? noop;
  onTokenizationClick = onTokenizationClick ?? noop;
  onRemoveHTMLClick = onRemoveHTMLClick ?? noop;
  onRemoveURLsClick = onRemoveURLsClick ?? noop;
  onRemoveSpecialCharsClick = onRemoveSpecialCharsClick ?? noop;
  onNormalizeCaseClick = onNormalizeCaseClick ?? noop;
  onRemoveWhitespaceClick = onRemoveWhitespaceClick ?? noop;
  onWordTokenizeClick = onWordTokenizeClick ?? noop;
  onSentenceTokenizeClick = onSentenceTokenizeClick ?? noop;
  onNGramClick = onNGramClick ?? noop;
  onRemoveStopWordsClick = onRemoveStopWordsClick ?? noop;
  onMinWordLengthClick = onMinWordLengthClick ?? noop;
  onStemmingClick = onStemmingClick ?? noop;
  onLemmatizationClick = onLemmatizationClick ?? noop;
  onSpellCorrectionClick = onSpellCorrectionClick ?? noop;
  onTFIDFClick = onTFIDFClick ?? noop;
  onBagOfWordsClick = onBagOfWordsClick ?? noop;
  onWordEmbeddingsClick = onWordEmbeddingsClick ?? noop;
  onLanguageDetectionClick = onLanguageDetectionClick ?? noop;
  onTranslationClick = onTranslationClick ?? noop;
  onEncodingNormalizationClick = onEncodingNormalizationClick ?? noop;
  onWordFrequencyClick = onWordFrequencyClick ?? noop;
  onTextStatsClick = onTextStatsClick ?? noop;
  onSentimentAnalysisClick = onSentimentAnalysisClick ?? noop;

  const hasStructuredData = dataKind === "structured";
  const hasUnstructuredData = dataKind === "unstructured";

  // State: Sidebar open/close sections
  const [openSections, setOpenSections] = useState({
    importData: true,
    exploreData: true,
    cleanData: true,
    engineerFeatures: true,
    aiSuggestions: true,
    saveExport: true,

    validation: false,
    exportDelivery: false,

    // Text Preprocessing main section
    textPreprocessing: false,

    // Text Preprocessing subtabs
    basicCleaning: false,
    tokenization: false,
    filtering: false,
    normalization: false,
    featureExtraction: false,
    languageEncoding: false,
  });

  // Fixed-width sidebar layout
  const collapsed = false;

  // Toggle any collapsible section
  const toggleSection = (section: keyof typeof openSections) => {
    if (disabled) return;

    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const iconColors = {
    importData: "text-blue-400",
    exploreData: "text-green-400",
    cleanData: "text-yellow-400",
    normalization: "text-purple-400",
    outliers: "text-red-400",
    classBalancing: "text-cyan-400",
    engineerFeatures: "text-teal-400",
    aiSuggestions: "text-indigo-400",
    saveExport: "text-pink-400",
    settings: "text-gray-400",
    validation: "text-lime-400",
    export: "text-indigo-300",
    textPreprocessing: "text-emerald-400",
  };

  return (
    <aside className="h-full w-[300px] bg-[#0b0b0b] text-slate-100 border-r border-[#151515] flex flex-col">
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {/* Import Data */}
          <CollapsibleSection
            title="Import Data"
            icon={
              <svg className={`h-4 w-4 ${iconColors.importData}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            }
            isOpen={openSections.importData}
            onToggle={() => toggleSection("importData")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <label
              className={`w-full block text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e] cursor-pointer"}`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Upload file
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={disabled}
              />
            </label>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onDatabaseConnectorsClick} disabled={disabled}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Connect database
              </span>
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onImportTextDataClick} disabled={disabled}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Import text data
              </span>
            </button>
          </CollapsibleSection>

          {/* Explore Data */}
          <CollapsibleSection
            title="Explore Data"
            icon={
              <svg className={`h-4 w-4 ${iconColors.exploreData}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            }
            isOpen={openSections.exploreData}
            onToggle={() => toggleSection("exploreData")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onDataSummaryClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Data Summary
              </span>
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onVisualizationClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Visualize & charts
              </span>
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onCorrelationAnalysisClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Correlation analysis
              </span>
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onPcaClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                PCA / DR
              </span>
            </button>
          </CollapsibleSection>

          {/* Validation / Tests */}
          <CollapsibleSection
            title="Validation & Tests"
            icon={
              <svg className={`h-4 w-4 ${iconColors.validation}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
              </svg>
            }
            isOpen={openSections.validation}
            onToggle={() => toggleSection("validation")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onValidationClick} disabled={disabled || !hasStructuredData}>
              Create validation rules
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Run test suite")} disabled={disabled}>
              Run tests
            </button>
          </CollapsibleSection>

          {/* Cleaning quick options */}
          <CollapsibleSection
            title="Handle Missing Values"
            icon={
              <svg className={`h-4 w-4 ${iconColors.cleanData}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
            isOpen={openSections.cleanData}
            onToggle={() => toggleSection("cleanData")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onAdvancedImputationClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Advanced imputation
              </span>
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onQuickImputeClick} disabled={disabled || !hasStructuredData}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Quick impute
              </span>
            </button>
          </CollapsibleSection>

          {/* Text Preprocessing for Unstructured Data */}
          <CollapsibleSection
            title="Text Preprocessing"
            icon={
              <svg className={`h-4 w-4 ${iconColors.textPreprocessing}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16" />
                <path d="M4 12h10" />
                <path d="M4 17h14" />
              </svg>
            }
            isOpen={openSections.textPreprocessing}
            onToggle={() => toggleSection("textPreprocessing")}
            disabled={disabled}
            collapsed={collapsed}
          >
            {/* Subtab 1: Basic Text Cleaning */}
            <button
              className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
              onClick={onBasicCleaningClick}
              disabled={disabled || !hasUnstructuredData}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Basic Cleaning
              </span>
            </button>

            {/* Subtab 2: Tokenization */}
            <button
              className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
              onClick={onTokenizationClick}
              disabled={disabled || !hasUnstructuredData}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Tokenization
              </span>
            </button>

            {/* Subtab 3: Filtering */}
            <button
              className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
              onClick={onRemoveStopWordsClick}
              disabled={disabled || !hasUnstructuredData}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Filtering
              </span>
            </button>


            {/* Subtab 4: Normalization */}
            <button
              className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
              onClick={onTextNormalizationClick}
              disabled={disabled || !hasUnstructuredData}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Normalization
              </span>
            </button>

            {/* Subtab 6: Feature Extraction */}
            <div className="mb-1">
              <button
                onClick={() => {
                  onFeatureExtractionClick?.();
                  setOpenSections((prev) => ({
                    ...prev,
                    textPreprocessing: false, // 🔥 IMPORTANT
                  }));
                }}
                className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
                disabled={disabled || !hasUnstructuredData}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Feature Extraction
                </span>
              </button>
            </div>




          </CollapsibleSection>

          {/* Normalization */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
                }`}
              onClick={onNormalizationClick ?? noop}
              disabled={disabled || !hasStructuredData}
              title={collapsed ? "Normalize, encode, scale" : undefined}
            >
              <svg className={`h-4 w-4 ${iconColors.normalization}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.5 2h-13A2.5 2.5 0 0 0 3 4.5v15A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 18.5 2z" />
                <path d="M7 12h10" />
                <path d="M12 17V7" />
              </svg>
              {!collapsed && (
                <span className="ml-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  Normalize & encode
                </span>
              )}
            </button>
          </div>

          {/* Label & Encoding */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
                }`}
              onClick={onLabelEncodingClick}
              disabled={disabled || !hasStructuredData}
              title={collapsed ? "Label & Encoding" : undefined}
            >
              <svg className={`h-4 w-4 ${iconColors.normalization}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
                <path d="M12 6v12" />
                <path d="M6 12h12" />
              </svg>
              {!collapsed && (
                <span className="ml-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  Label & Encoding
                </span>
              )}
            </button>
          </div>

          {/* Outliers */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
                }`}
              onClick={onOutliersClick}
              disabled={disabled || !hasStructuredData}
              title={collapsed ? "Remove outliers" : undefined}
            >
              <svg className={`h-4 w-4 ${iconColors.outliers}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              {!collapsed && (
                <span className="ml-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  Remove outliers
                </span>
              )}
            </button>
          </div>
          {/* Class Balancing */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "justify-start"
              } px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                disabled || !hasStructuredData
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#1e1e1e]"
              }`}
              onClick={onClassBalancingClick}
              disabled={disabled || !hasStructuredData}
              title={collapsed ? "Balance class distribution" : undefined}
            >
              <svg
                className={`h-4 w-4 ${iconColors.classBalancing}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16" />
                <path d="M4 12h10" />
                <path d="M4 18h7" />
              </svg>

              {!collapsed && (
                <span className="ml-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                  Balance classes
                </span>
              )}
            </button>
          </div>

          {/* Save & Export */}
          <CollapsibleSection
            title="Save & Export"
            icon={
              <svg className={`h-4 w-4 ${iconColors.saveExport}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            }
            isOpen={openSections.saveExport}
            onToggle={() => toggleSection("saveExport")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onSaveProjectClick} disabled={disabled}>
              Save project
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled || !hasStructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`} onClick={onExportClick} disabled={disabled || !hasStructuredData}>
              Export CSV / Parquet
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Deliver to warehouse")} disabled={disabled}>
              Deliver to warehouse
            </button>
          </CollapsibleSection>
        </div>
      </ScrollArea>

      {/* Footer: settings */}
      <div className="p-2.5 mt-auto border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <button
          className={`w-full flex items-center justify-center px-2 py-2 text-xs rounded-md border border-transparent transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#111827] hover:border-[#1f2937]"
            }`}
          disabled={disabled}
          title={collapsed ? "Settings" : undefined}
        >
          <svg className={`h-4 w-4 ${iconColors.settings}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
          </svg>
          {!collapsed && <span className="ml-2">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
