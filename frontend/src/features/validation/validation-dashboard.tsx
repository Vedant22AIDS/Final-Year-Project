"use client";

import React, { useMemo, useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { ArrowLeft, Play, CheckCircle, XCircle } from "lucide-react";

/** --- Types (local to this file) --- */
type Severity = "low" | "medium" | "high";
type RuleType = "not_null" | "range" | "regex" | "unique";

export interface ValidationRule {
    id: string;
    column: string;
    type: RuleType;
    severity: Severity;
    // optional parameters for rule (range, regex or value)
    params?: {
        min?: number;
        max?: number;
        pattern?: string;
        // future extensible
    };
}

export interface ValidationResult {
    ruleId: string;
    column: string;
    passed: boolean;
    failedCount: number;
    totalCount: number;
}

/** --- Small helper UI pieces --- */
function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "success" | "danger" | "default" }) {
    const base = "inline-flex items-center px-2 py-0.5 text-xs rounded";
    if (tone === "success") return <span className={`${base} bg-green-800 text-green-200`}>{children}</span>;
    if (tone === "danger") return <span className={`${base} bg-red-800 text-red-200`}>{children}</span>;
    return <span className={`${base} bg-slate-800 text-slate-200`}>{children}</span>;
}


/** --- RuleBuilder (embedded) --- */
function RuleBuilder({
    columns,
    onAddRule,
}: {
    columns: string[];
    onAddRule: (r: ValidationRule) => void;
}) {
    const [column, setColumn] = useState<string>(columns[0] ?? "");
    const [type, setType] = useState<RuleType>("not_null");
    const [severity, setSeverity] = useState<Severity>("medium");
    const [min, setMin] = useState<string>("");
    const [max, setMax] = useState<string>("");
    const [pattern, setPattern] = useState<string>("");

    // When columns prop changes, ensure selected column stays valid
    React.useEffect(() => {
        if (columns.length && !columns.includes(column)) setColumn(columns[0]);
    }, [columns]);

    const handleAdd = () => {
        if (!column) {
            alert("Please select a column");
            return;
        }

        const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const rule: ValidationRule = {
            id,
            column,
            type,
            severity,
            params: {},
        };

        if (type === "range") {
            const minN = min.trim() === "" ? undefined : Number(min);
            const maxN = max.trim() === "" ? undefined : Number(max);
            rule.params = { min: minN, max: maxN };
        } else if (type === "regex") {
            rule.params = { pattern };
        }

        onAddRule(rule);

        // reset small inputs (keep column)
        setType("not_null");
        setSeverity("medium");
        setMin("");
        setMax("");
        setPattern("");
    };

    return (
        <div className="bg-[#0b0b0b] p-3 rounded border border-[#222] space-y-3">
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300 w-20">Column</label>
                <select value={column} onChange={(e) => setColumn(e.target.value)} className="flex-1 bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm">
                    <option value="">-- select --</option>
                    {columns.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300 w-20">Rule</label>
                <select value={type} onChange={(e) => setType(e.target.value as RuleType)} className="flex-1 bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm">
                    <option value="not_null">Not Null</option>
                    <option value="range">Range (numeric)</option>
                    <option value="regex">Regex (pattern)</option>
                    <option value="unique">Unique</option>
                </select>
            </div>

            {type === "range" && (
                <div className="flex gap-2">
                    <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="min" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm flex-1" />
                    <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="max" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm flex-1" />
                </div>
            )}

            {type === "regex" && (
                <div>
                    <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="regex (javascript syntax)" className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm" />
                    <div className="text-xs text-gray-500 mt-1">Example: ^[A-Z]{2}\d{4}$</div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300 w-20">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <div className="flex-1"></div>
                <Button onClick={handleAdd} variant="outline">
                    Add Rule
                </Button>
            </div>
        </div>
    );
}

/** --- TestResults (embedded) --- */
function TestResults({ results }: { results: ValidationResult[] }) {
    if (!results || results.length === 0) {
        return (
            <div className="bg-[#0b0b0b] p-3 rounded border border-[#222] text-sm text-gray-400">
                No test results yet — run tests to see results.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {results.map((r) => {
                const passed = r.passed;
                const passPercent = r.totalCount === 0 ? 100 : Math.round(((r.totalCount - r.failedCount) / r.totalCount) * 100);
                return (
                    <div key={r.ruleId} className="p-3 bg-[#0b0b0b] rounded border border-[#222]">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-medium">{r.column}</div>
                                    <div className="text-xs text-gray-400">({r.ruleId})</div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Failed: {r.failedCount} / {r.totalCount}</div>
                            </div>
                            <div className="text-right">
                                {passed ? (
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                        <div className="text-sm font-medium text-green-300">Passed</div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <XCircle className="h-5 w-5 text-red-400" />
                                        <div className="text-sm font-medium text-red-300">Failed</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="h-2 w-full bg-[#111] rounded overflow-hidden border border-[#222]">
                                <div style={{ width: `${passPercent}%` }} className={`h-full ${passPercent >= 90 ? "bg-green-500" : passPercent >= 60 ? "bg-yellow-500" : "bg-red-500"}`}></div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{passPercent}% rows passing</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** --- Top-level dashboard (default export) --- */
interface Props {
    data: any[];
    onBack: () => void;
}

export default function ValidationDashboard({ data = [], onBack }: Props) {
    const [rules, setRules] = useState<ValidationRule[]>([]);
    const [results, setResults] = useState<ValidationResult[]>([]);

    const columns = useMemo(() => (data.length ? Object.keys(data[0]) : []), [data]);

    const runTests = () => {
        // NOTE: this is frontend mock logic. Replace with backend validations later.
        const newResults: ValidationResult[] = rules.map((rule) => {
            const total = data.length;
            let failed = 0;

            if (rule.type === "not_null") {
                failed = data.filter((row) => row[rule.column] === null || row[rule.column] === undefined || row[rule.column] === "").length;
            } else if (rule.type === "unique") {
                const vals = data.map((r) => r[rule.column]);
                const freq = vals.reduce<Record<string, number>>((acc, v) => {
                    const k = String(v);
                    acc[k] = (acc[k] || 0) + 1;
                    return acc;
                }, {});
                failed = Object.values(freq).filter((c) => c > 1).reduce((s, n) => s + n - 1, 0); // number of duplicates beyond the first
            } else if (rule.type === "range") {
                const min = rule.params?.min;
                const max = rule.params?.max;
                failed = data.filter((row) => {
                    const v = Number(row[rule.column]);
                    if (Number.isNaN(v)) return true;
                    if (min !== undefined && v < min) return true;
                    if (max !== undefined && v > max) return true;
                    return false;
                }).length;
            } else if (rule.type === "regex") {
                let re: RegExp | null = null;
                try {
                    re = new RegExp(rule.params?.pattern || "");
                } catch {
                    re = null;
                }
                failed = data.filter((row) => {
                    const v = row[rule.column];
                    if (v === null || v === undefined) return true;
                    if (!re) return true;
                    return !re.test(String(v));
                }).length;
            }

            return {
                ruleId: rule.id,
                column: rule.column,
                passed: failed === 0,
                failedCount: failed,
                totalCount: total,
            };
        });

        setResults(newResults);
    };

    const handleAddRule = (r: ValidationRule) => {
        setRules((prev) => [...prev, r]);
    };

    const handleRemoveRule = (id: string) => {
        setRules((prev) => prev.filter((p) => p.id !== id));
        setResults((prev) => prev.filter((res) => res.ruleId !== id));
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#000] p-4 space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h2 className="text-2xl font-bold">Validation & Tests</h2>
            </div>

            <p className="text-gray-400">
                Define data quality rules and validate your dataset. (Client-side mock runner)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <RuleBuilder columns={columns} onAddRule={handleAddRule} />

                    {rules.length > 0 && (
                        <div className="bg-[#0b0b0b] p-3 rounded border border-[#222] space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">Rules ({rules.length})</div>
                                <div className="flex gap-2">
                                    <Button onClick={runTests} className="flex items-center gap-2">
                                        <Play className="h-4 w-4" />
                                        Run Tests
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {rules.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between bg-[#070707] p-2 rounded border border-[#222]">
                                        <div>
                                            <div className="text-sm font-medium">{r.column}</div>
                                            <div className="text-xs text-gray-400">
                                                {r.type} {r.params && r.type === "range" ? `(min:${r.params.min ?? "-"} max:${r.params.max ?? "-"})` : r.params && r.type === "regex" ? `(pattern: ${r.params.pattern})` : ""}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge>{r.severity}</Badge>
                                            <Button variant="outline" onClick={() => handleRemoveRule(r.id)}>Remove</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-[#0b0b0b] p-3 rounded border border-[#222]">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">Test Runner</div>
                            <div className="text-xs text-gray-400">{data.length} rows</div>
                        </div>

                        <div className="mt-3">
                            <div className="flex gap-2">
                                <Button onClick={runTests} className="flex-1">Run</Button>
                                <Button variant="outline" onClick={() => setResults([])}>Clear</Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <TestResults results={results} />
                    </div>
                </div>
            </div>
        </div>
    );
}
