"use client"

interface DataTableProps {
  data: any[]
  fileName?: string
}

export function DataTable({ data, fileName }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 border border-[#2a2a2a] rounded-md">
        No data available. Please upload a CSV file to get started.
      </div>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <div className="max-h-[500px] overflow-auto border border-[#2e2e2e] rounded-md no-scrollbar">
      <table className="w-full min-w-[600px] text-sm text-left text-gray-200">
        <thead className="bg-[#1f1f1f] sticky top-0 z-10 border-b border-[#444]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 font-semibold text-sm tracking-wide text-gray-100 bg-[#1f1f1f]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-[#333] hover:bg-[#2b2b2b] transition-colors"
            >
              {columns.map((column) => (
                <td key={column} className="px-4 py-2 text-gray-300 whitespace-nowrap">
                  {row[column] === null || row[column] === undefined ? (
                    <span className="text-red-400 italic">null</span>
                  ) : (
                    String(row[column])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
