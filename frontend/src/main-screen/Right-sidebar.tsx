import React, { useEffect, useState } from "react";
import type { LogEntry } from "./Main";
import { ScrollArea } from "../components/ui/ScrollArea.tsx";

interface RightSidebarProps {
  logs: LogEntry[];
  onSendMessage?: (msg: string, agentMode?: boolean) => Promise<string> | string;
}

export function RightSidebar({ logs, onSendMessage }: RightSidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<"log" | "agent">("log");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([]);

  useEffect(() => {
    if (activeTab !== "agent" || agentMessages.length > 0 || !onSendMessage) return;

    const runDefaultPrompt = async () => {
      try {
        setAgentLoading(true);
        const initial = await onSendMessage("", false);
        const assistantText = typeof initial === "string" ? initial : "";
        if (assistantText.trim()) {
          setAgentMessages([{ role: "assistant", text: assistantText }]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Agent is unavailable. Please check backend/Ollama setup."
        setAgentMessages([{ role: "assistant", text: errorMessage }]);
      } finally {
        setAgentLoading(false);
      }
    };

    runDefaultPrompt();
  }, [activeTab, agentMessages.length, onSendMessage]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const question = inputValue.trim();
    setAgentMessages((prev) => [...prev, { role: "user", text: question }]);
    setInputValue("");
    if (!onSendMessage) return;

    try {
      setAgentLoading(true);
      const reply = await onSendMessage(question, true);
      const assistantText = typeof reply === "string" ? reply : "";
      setAgentMessages((prev) => [...prev, { role: "assistant", text: assistantText || "No response from agent." }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Agent request failed. Please try again."
      setAgentMessages((prev) => [...prev, { role: "assistant", text: errorMessage }]);
    } finally {
      setAgentLoading(false);
    }
  };

  return (
    <aside className="w-full bg-black flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab("log")}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "log"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "bg-[#111] text-slate-400 border border-[#2a2a2a] hover:text-slate-200"
            }`}
          >
            Log
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "agent"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "bg-[#111] text-slate-400 border border-[#2a2a2a] hover:text-slate-200"
            }`}
          >
            Agent
          </button>
        </div>
      </div>

      {/* SECTION 1: SYSTEM LOGS */}
      {activeTab === "log" && <div className="flex-1 flex flex-col min-h-0">
        {/* REFINED TITLE BOX */}
        <div className="px-4 py-2.5 flex items-center justify-between bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              System Logs
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            {logs.length} EVT
          </span>
        </div>

        <ScrollArea className="flex-1" viewportClassName="p-3 space-y-2">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-gray-700 uppercase tracking-widest">
              // NO_ACTIVE_LOGS
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="p-2.5 border border-[#222] bg-[#050505] rounded hover:border-[#333] transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-medium text-gray-300">
                    {log.title}
                  </div>
                  <span className="text-[9px] font-mono text-emerald-500/80">{log.date}</span>
                </div>
                {log.details && <div className="text-[10px] text-gray-500 mt-1.5 font-mono leading-tight border-l border-[#222] pl-2">{log.details}</div>}
              </div>
            ))
          )}
        </ScrollArea>
      </div>}

      {/* SECTION 2: AI AGENT */}
      {activeTab === "agent" && <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">

        {/* REFINED TITLE BOX */}
        <div className="px-4 py-2.5 border-b border-[#1a1a1a] flex items-center justify-between shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <div className="absolute inset-0 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping opacity-40" />
            </div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Analysis Agent
            </h2>
          </div>
          <div className="text-[9px] font-mono text-blue-400/70 border border-blue-500/20 px-1.5 py-0.5 rounded bg-blue-500/5">
            v1.0.4-β
          </div>
        </div>

        {/* Scrollable Feed */}
        <ScrollArea className="flex-1" viewportClassName="p-4 space-y-4">
          {agentMessages.length === 0 && !agentLoading && (
            <div className="text-[11px] text-gray-600 font-mono">No agent responses yet.</div>
          )}
          {agentMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`p-3 border rounded-lg ${
                message.role === "assistant"
                  ? "bg-[#0a0a0a] border-[#1a1a1a]"
                  : "bg-[#0b1320] border-[#1f2b44]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-tighter ${
                    message.role === "assistant" ? "text-blue-500" : "text-emerald-400"
                  }`}
                >
                  {message.role === "assistant" ? "@agent" : "@you"}
                </span>
              </div>
              <p className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
          {agentLoading && (
            <div className="text-[11px] text-blue-400 font-mono">Agent is thinking...</div>
          )}
        </ScrollArea>

        {/* Input area remains the same logic, updated border for consistency */}
        <div className="shrink-0 px-3 pt-3 pb-8 border-t border-[#1a1a1a] bg-[#080808]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the agent..."
              disabled={agentLoading}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg py-2.5 pl-3 pr-10 text-[12px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={agentLoading}
              className="absolute right-2 p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            {['/clean', '/stats', '/fix'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => setInputValue(cmd + " ")}
                className="text-[9px] font-mono text-gray-600 hover:text-blue-400 transition-colors px-1.5 py-0.5 border border-white/5 bg-white/5 rounded"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

      </div>}
    </aside>
  );
}
