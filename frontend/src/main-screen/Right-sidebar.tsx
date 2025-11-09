import type { LogEntry } from "./Main"

interface RightSidebarProps {
  logs: LogEntry[]
}

export function RightSidebar({ logs }: RightSidebarProps) {
  return (
    <div className="w-80 border-l border-[#2a2a2a] bg-[#000000] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#2a2a2a]">
        <h2 className="text-base font-medium">Processing Logs</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500">No processing logs yet.</div>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
              <div className="p-3">
                <div className="flex items-center">
                  <span className="text-xs font-normal py-0 h-5 px-2 rounded-full border border-[#2a2a2a] bg-transparent">
                    {log.date}
                  </span>
                </div>
                <div className="mt-1 font-medium text-sm">{log.title}</div>
                {log.details && <div className="mt-1 text-xs text-gray-400">{log.details}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[#2a2a2a]">
        <h2 className="text-base font-medium mb-3">AI Recommendations</h2>

        <div className="space-y-3">
          <div className="bg-[#004440] border border-[#2a2a2a] rounded-md overflow-hidden">
            <div className="p-3">
              <div className="flex items-start">
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
                  className="h-4 w-4 mr-2 mt-0.5 text-green-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div>
                  <div className="text-sm">Consider using median imputation to handle missing values.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
            <div className="p-3">
              <div className="flex items-start">
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
                  className="h-4 w-4 mr-2 mt-0.5 text-green-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div>
                  <div className="text-sm">The "Credit Score" column appears highly skewed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Intracection</span>
              <span className="text-blue-400">AKE</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Completed</span>
              <span>10:25 36 am</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
