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
  onMissingValuesClick?: () => void;
  onDatabaseConnectorsClick?: () => void;
  onNormalizationClick?: () => void;
  onOutliersClick?: () => void;
  onSaveProjectClick?: () => void;
  disabled?: boolean;

  /* New optional handlers for expanded feature set */
  onPipelinesClick?: () => void;
  onValidationClick?: () => void;
  onMonitoringClick?: () => void;
  onPermissionsClick?: () => void;
  onCollaborationClick?: () => void;
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
  onMissingValuesClick,
  onDatabaseConnectorsClick,
  onNormalizationClick,
  onOutliersClick,
  onSaveProjectClick,
  disabled = false,

  // new optional handlers (safe defaults used inside)
  onPipelinesClick,
  onValidationClick,
  onMonitoringClick,
  onPermissionsClick,
  onCollaborationClick,
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
  onDatabaseConnectorsClick = onDatabaseConnectorsClick ?? noop;
  onOutliersClick = onOutliersClick ?? noop;
  onSaveProjectClick = onSaveProjectClick ?? noop;
  // ensure handlers exist
  onPipelinesClick = onPipelinesClick ?? noop;
  onValidationClick = onValidationClick ?? noop;
  onMonitoringClick = onMonitoringClick ?? noop;
  onPermissionsClick = onPermissionsClick ?? noop;
  onCollaborationClick = onCollaborationClick ?? noop;
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

    pipelines: false,
    validation: false,
    monitoring: false,
    accessControl: false,
    collaboration: false,
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
    engineerFeatures: "text-teal-400",
    aiSuggestions: "text-indigo-400",
    saveExport: "text-pink-400",
    settings: "text-gray-400",
    pipelines: "text-violet-400",
    validation: "text-lime-400",
    monitoring: "text-red-300",
    permissions: "text-emerald-300",
    collaboration: "text-fuchsia-400",
    export: "text-indigo-300",
    textPreprocessing: "text-orange-400",
  };

  return (
    <aside
      className="left-sidebar-pro flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-[#060606] via-[#050505] to-[#040404]"
      aria-label="Left sidebar"
    >
      {/* Header */}
      <div className="pt-3 p-2.5 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#1f2937] bg-[#0f172a]/40 px-2 py-1.5">
            <span className="text-xs font-semibold text-slate-100">DATABits</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/40">TOOLSET</span>
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">Preprocessing Controls</div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400"></span>
            Structured
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Unstructured
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2.5">
          {/* Import Data */}
          <CollapsibleSection
            title="Import Data"
            icon={
              <svg className={`h-4 w-4 ${iconColors.importData}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            }
            isOpen={openSections.importData}
            onToggle={() => toggleSection("importData")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-transparent transition-colors text-slate-300 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#111827] hover:border-[#1f2937]"
                }`}
              onClick={() => !disabled && document.getElementById("fileUpload")?.click()}
              disabled={disabled}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Import CSV / Excel
              </span>
            </button>
            <input
              type="file"
              id="fileUpload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
            <button className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-transparent transition-colors text-slate-300 ${disabled ? "opacity-50" : "hover:bg-[#111827] hover:border-[#1f2937]"}`} title="Connect a database (JDBC, Postgres, MySQL)" onClick={onDatabaseConnectorsClick} disabled={disabled}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Database connectors
              </span>
            </button>
            <button className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-transparent transition-colors text-slate-300 ${disabled ? "opacity-50" : "hover:bg-[#111827] hover:border-[#1f2937]"}`} onClick={() => window.alert("S3 / GCS connectors - configure in Integrations")} disabled={disabled}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Cloud storage connectors
              </span>
            </button>
            <button
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-transparent transition-colors text-slate-300 ${disabled ? "opacity-50" : "hover:bg-[#111827] hover:border-[#1f2937]"}`}
              onClick={onImportTextDataClick}
              disabled={disabled}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Import unstructured data
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
          </CollapsibleSection>

          {/* Pipelines & Templates */}
          <CollapsibleSection
            title="Pipelines & Templates"
            icon={
              <svg className={`h-4 w-4 ${iconColors.pipelines}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            }
            isOpen={openSections.pipelines}
            onToggle={() => toggleSection("pipelines")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onPipelinesClick} disabled={disabled}>
              Open pipelines editor
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Clone pipeline")} disabled={disabled}>
              Clone pipeline
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

            {/* Subtab 7: Label & Encoding */}
            <div className="mb-1">
              <button
                onClick={onLabelEncodingClick}
                className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${disabled || !hasUnstructuredData ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"}`}
                disabled={disabled || !hasUnstructuredData}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Label & Encoding
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

          {/* Monitoring & Alerts */}
          <CollapsibleSection
            title="Monitoring & Alerts"
            icon={
              <svg className={`h-4 w-4 ${iconColors.monitoring}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h3l3 8 4-16 3 8h3" />
              </svg>
            }
            isOpen={openSections.monitoring}
            onToggle={() => toggleSection("monitoring")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onMonitoringClick} disabled={disabled}>
              Alerts & notifications
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Create monitor")} disabled={disabled}>
              Create monitors
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Incident history")} disabled={disabled}>
              Incident history
            </button>
          </CollapsibleSection>

          {/* Access Control */}
          <CollapsibleSection
            title="Access & Permissions"
            icon={
              <svg className={`h-4 w-4 ${iconColors.permissions}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 0 1 7 7v3" />
                <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
              </svg>
            }
            isOpen={openSections.accessControl}
            onToggle={() => toggleSection("accessControl")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onPermissionsClick} disabled={disabled}>
              Roles & RBAC
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Invite member")} disabled={disabled}>
              Invite & audit
            </button>
          </CollapsibleSection>

          {/* Collaboration */}
          <CollapsibleSection
            title="Collaboration"
            icon={
              <svg className={`h-4 w-4 ${iconColors.collaboration}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H7" />
                <circle cx="9" cy="7" r="4" />
                <path d="M20 8v6" />
                <path d="M23 11h-6" />
              </svg>
            }
            isOpen={openSections.collaboration}
            onToggle={() => toggleSection("collaboration")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onCollaborationClick} disabled={disabled}>
              Comments & notes
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Share snapshot")} disabled={disabled}>
              Share snapshot
            </button>
          </CollapsibleSection>

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
