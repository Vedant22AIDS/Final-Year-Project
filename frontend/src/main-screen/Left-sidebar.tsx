"use client";

import * as React from "react";
import { useState } from "react";

interface LeftSidebarProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImputeMissingValues: () => void;
  onVisualizationClick: () => void;
  onDataSummaryClick: () => void;
  onCorrelationAnalysisClick: () => void;
  onMissingValuesClick?: () => void;
  onNormalizationClick?: () => void;
  disabled?: boolean;

  /* New optional handlers for expanded feature set */
  onConnectorsClick?: () => void;
  onPipelinesClick?: () => void;
  onScheduleClick?: () => void;
  onJobHistoryClick?: () => void;
  onVersioningClick?: () => void;
  onLineageClick?: () => void;
  onValidationClick?: () => void;
  onMonitoringClick?: () => void;
  onPermissionsClick?: () => void;
  onCollaborationClick?: () => void;
  onIntegrationsClick?: () => void;
  onTemplatesClick?: () => void;
  onComplianceClick?: () => void;
  onObservabilityClick?: () => void;
  onExportClick?: () => void;
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
          className={`flex items-center justify-center p-2 rounded-md transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
          }`}
        >
          {icon}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
        }`}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
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
      {isOpen && <div className="pl-6 pr-2 py-1 space-y-1">{children}</div>}
    </div>
  );
}

/* LeftSidebar: extended with many non-repetitive features */
export function LeftSidebar({
  handleFileUpload,
  handleImputeMissingValues,
  onVisualizationClick,
  onDataSummaryClick,
  onCorrelationAnalysisClick,
  onMissingValuesClick,
  onNormalizationClick,
  disabled = false,

  // new optional handlers (safe defaults used inside)
  onConnectorsClick,
  onPipelinesClick,
  onScheduleClick,
  onJobHistoryClick,
  onVersioningClick,
  onLineageClick,
  onValidationClick,
  onMonitoringClick,
  onPermissionsClick,
  onCollaborationClick,
  onIntegrationsClick,
  onTemplatesClick,
  onComplianceClick,
  onObservabilityClick,
  onExportClick,
}: LeftSidebarProps) {
  const noop = () => {};
  // ensure handlers exist
  onConnectorsClick = onConnectorsClick ?? noop;
  onPipelinesClick = onPipelinesClick ?? noop;
  onScheduleClick = onScheduleClick ?? noop;
  onJobHistoryClick = onJobHistoryClick ?? noop;
  onVersioningClick = onVersioningClick ?? noop;
  onLineageClick = onLineageClick ?? noop;
  onValidationClick = onValidationClick ?? noop;
  onMonitoringClick = onMonitoringClick ?? noop;
  onPermissionsClick = onPermissionsClick ?? noop;
  onCollaborationClick = onCollaborationClick ?? noop;
  onIntegrationsClick = onIntegrationsClick ?? noop;
  onTemplatesClick = onTemplatesClick ?? noop;
  onComplianceClick = onComplianceClick ?? noop;
  onObservabilityClick = onObservabilityClick ?? noop;
  onExportClick = onExportClick ?? noop;

  const [openSections, setOpenSections] = useState({
    importData: true,
    exploreData: true,
    cleanData: true,
    engineerFeatures: true,
    aiSuggestions: true,
    saveExport: true,
    connectors: false,
    pipelines: false,
    scheduling: false,
    lineage: false,
    versioning: false,
    validation: false,
    monitoring: false,
    accessControl: false,
    collaboration: false,
    integrations: false,
    templates: false,
    compliance: false,
    observability: false,
    exportDelivery: false,
  });
  const [collapsed, setCollapsed] = useState(false);

  const toggleSection = (section: keyof typeof openSections) => {
    if (disabled) return;
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleHamburgerClick = () => {
    setCollapsed((prev) => !prev);
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
    hamburger: "text-gray-300",
    connectors: "text-cyan-400",
    pipelines: "text-violet-400",
    scheduling: "text-amber-400",
    versioning: "text-slate-300",
    lineage: "text-rose-400",
    validation: "text-lime-400",
    monitoring: "text-red-300",
    permissions: "text-emerald-300",
    collaboration: "text-fuchsia-400",
    integrations: "text-blue-300",
    templates: "text-amber-300",
    compliance: "text-pink-300",
    observability: "text-sky-300",
    export: "text-indigo-300",
  };

  return (
    <aside
      className={`flex flex-col overflow-y-auto border-r border-[#2a2a2a] bg-[#000000] transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-72"
      }`}
      aria-label="Left sidebar"
    >
      {/* Header */}
      <div className="pt-4 p-2 border-b border-[#2a2a2a] flex items-center justify-between">
        <button
          onClick={handleHamburgerClick}
          disabled={disabled}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex items-center justify-center p-1 rounded-md transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 ${iconColors.hamburger}`}
            aria-hidden
          >
            <line x1="4" x2="20" y1="12" y2="12"></line>
            <line x1="4" x2="20" y1="6" y2="6"></line>
            <line x1="4" x2="20" y1="18" y2="18"></line>
          </svg>
        </button>
        {!collapsed && <span className="text-sm font-medium text-gray-400">Tools & Pipelines</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
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
              className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
              }`}
              onClick={() => !disabled && document.getElementById("fileUpload")?.click()}
              disabled={disabled}
            >
              Import CSV / Excel
            </button>
            <input
              type="file"
              id="fileUpload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} title="Connect a database (JDBC, Postgres, MySQL)" onClick={onConnectorsClick} disabled={disabled}>
              Database connectors
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => window.alert("S3 / GCS connectors - configure in Integrations")} disabled={disabled}>
              Cloud storage connectors
            </button>
          </CollapsibleSection>

          {/* Connectors (more detailed) */}
          <CollapsibleSection
            title="Connectors & Sources"
            icon={
              <svg className={`h-4 w-4 ${iconColors.connectors}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h6" />
                <path d="M15 12h6" />
                <path d="M12 3v6" />
                <path d="M12 15v6" />
              </svg>
            }
            isOpen={openSections.connectors}
            onToggle={() => toggleSection("connectors")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onConnectorsClick} disabled={disabled}>
              Configure connectors
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Test connection")} disabled={disabled}>
              Test & health checks
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
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onDataSummaryClick} disabled={disabled}>
              Data Summary
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onVisualizationClick} disabled={disabled}>
              Visualize & charts
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onCorrelationAnalysisClick} disabled={disabled}>
              Correlation analysis
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onObservabilityClick} disabled={disabled}>
              Observability metrics
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
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onTemplatesClick} disabled={disabled}>
              Templates & marketplace
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Clone pipeline")} disabled={disabled}>
              Clone pipeline
            </button>
          </CollapsibleSection>

          {/* Scheduling */}
          <CollapsibleSection
            title="Scheduling & Jobs"
            icon={
              <svg className={`h-4 w-4 ${iconColors.scheduling}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            }
            isOpen={openSections.scheduling}
            onToggle={() => toggleSection("scheduling")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onScheduleClick} disabled={disabled}>
              Schedule pipeline
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onJobHistoryClick} disabled={disabled}>
              Job history & retries
            </button>
          </CollapsibleSection>

          {/* Versioning / Snapshots */}
          <CollapsibleSection
            title="Versioning & Snapshots"
            icon={
              <svg className={`h-4 w-4 ${iconColors.versioning}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20" />
                <path d="M5 6h14" />
                <path d="M5 18h14" />
              </svg>
            }
            isOpen={openSections.versioning}
            onToggle={() => toggleSection("versioning")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onVersioningClick} disabled={disabled}>
              Snapshot & rollback
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Diff view")} disabled={disabled}>
              Compare versions
            </button>
          </CollapsibleSection>

          {/* Lineage */}
          <CollapsibleSection
            title="Data Lineage"
            icon={
              <svg className={`h-4 w-4 ${iconColors.lineage}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h6" />
                <path d="M15 12h6" />
                <path d="M12 3v6" />
                <path d="M12 15v6" />
              </svg>
            }
            isOpen={openSections.lineage}
            onToggle={() => toggleSection("lineage")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onLineageClick} disabled={disabled}>
              View lineage graph
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Export lineage report")} disabled={disabled}>
              Export lineage
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
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onValidationClick} disabled={disabled}>
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
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onMissingValuesClick} disabled={disabled}>
              Advanced imputation
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={handleImputeMissingValues} disabled={disabled}>
              Quick impute (mean)
            </button>
          </CollapsibleSection>

          {/* Normalization */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
              }`}
              onClick={onNormalizationClick ?? noop}
              disabled={disabled}
              title={collapsed ? "Normalize, encode, scale" : undefined}
            >
              <svg className={`h-4 w-4 ${iconColors.normalization}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.5 2h-13A2.5 2.5 0 0 0 3 4.5v15A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 18.5 2z" />
                <path d="M7 12h10" />
                <path d="M12 17V7" />
              </svg>
              {!collapsed && <span className="ml-2">Normalize & encode</span>}
            </button>
          </div>

          {/* Outliers */}
          <div className={collapsed ? "flex justify-center mb-1" : ""}>
            <button
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
              }`}
              disabled={disabled}
              title={collapsed ? "Remove outliers" : undefined}
            >
              <svg className={`h-4 w-4 ${iconColors.outliers}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              {!collapsed && <span className="ml-2">Remove outliers</span>}
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

          {/* Integrations */}
          <CollapsibleSection
            title="Integrations"
            icon={
              <svg className={`h-4 w-4 ${iconColors.integrations}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6" />
                <path d="M12 16v6" />
                <path d="M4 8l8 8" />
                <path d="M20 8l-8 8" />
              </svg>
            }
            isOpen={openSections.integrations}
            onToggle={() => toggleSection("integrations")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onIntegrationsClick} disabled={disabled}>
              Connectors & streaming (Kafka, Kinesis)
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Airflow / orchestration webhooks")} disabled={disabled}>
              Orchestration (Airflow)
            </button>
          </CollapsibleSection>

          {/* Templates & Marketplace */}
          <CollapsibleSection
            title="Templates & Marketplace"
            icon={
              <svg className={`h-4 w-4 ${iconColors.templates}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            }
            isOpen={openSections.templates}
            onToggle={() => toggleSection("templates")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onTemplatesClick} disabled={disabled}>
              Browse templates
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Submit template")} disabled={disabled}>
              Publish template
            </button>
          </CollapsibleSection>

          {/* Compliance & Security */}
          <CollapsibleSection
            title="Compliance & Security"
            icon={
              <svg className={`h-4 w-4 ${iconColors.compliance}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
              </svg>
            }
            isOpen={openSections.compliance}
            onToggle={() => toggleSection("compliance")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onComplianceClick} disabled={disabled}>
              Encryption & audit logs
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Export compliance report")} disabled={disabled}>
              Compliance reports
            </button>
          </CollapsibleSection>

          {/* Observability */}
          <CollapsibleSection
            title="Observability & Metrics"
            icon={
              <svg className={`h-4 w-4 ${iconColors.observability}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16" />
                <path d="M4 12h10" />
                <path d="M4 18h7" />
              </svg>
            }
            isOpen={openSections.observability}
            onToggle={() => toggleSection("observability")}
            disabled={disabled}
            collapsed={collapsed}
          >
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onObservabilityClick} disabled={disabled}>
              Metrics & dashboards
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Prometheus / Grafana links")} disabled={disabled}>
              External monitoring
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
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Save project")} disabled={disabled}>
              Save project
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={onExportClick} disabled={disabled}>
              Export CSV / Parquet
            </button>
            <button className={`w-full text-left px-2 py-1 text-xs rounded-md ${disabled ? "opacity-50" : "hover:bg-[#1e1e1e]"}`} onClick={() => alert("Deliver to warehouse")} disabled={disabled}>
              Deliver to warehouse
            </button>
          </CollapsibleSection>
        </div>
      </div>

      {/* Footer: settings */}
      <div className="p-2 mt-auto border-t border-[#2a2a2a]">
        <button
          className={`w-full flex items-center justify-center px-2 py-1 text-xs rounded-md transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#1e1e1e]"
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
