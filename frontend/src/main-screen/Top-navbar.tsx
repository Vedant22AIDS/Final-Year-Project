import { useAuth0 } from "@auth0/auth0-react"
import { ArrowLeft, Download, FolderOpen, LayoutGrid, Play, User } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

interface TopNavbarProps {
  handleExportFile: () => void
  handleSaveProject: () => void
}

export function TopNavbar({ handleExportFile, handleSaveProject }: TopNavbarProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth0()

  const userName = user?.name || user?.email || "User"
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center h-14 px-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
      <button
        onClick={() => navigate("/")}
        className="mr-2 px-3 py-1.5 rounded-lg border border-[#1f2937] bg-[#101010] hover:bg-[#111827] transition-colors inline-flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4 text-slate-300" />
        <span className="text-xs font-medium text-slate-200">Home</span>
      </button>

      <div className="mr-4 inline-flex items-center gap-2 rounded-lg border border-[#1f2937] bg-[#101010] px-2.5 py-1.5">
        <img src="/assets/logo.png" alt="DATABits" className="h-5 w-5 rounded object-cover" />
        <span className="text-xs font-semibold tracking-wide text-slate-100">DATABits</span>
      </div>

      <div className="relative flex-1 max-w-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search data, techniques, columns..."
          className="pl-8 bg-[#111] border-[#222] h-9 w-full rounded-md border px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>

      <div className="flex items-center ml-auto gap-2">
        <button className="p-2 rounded-md border border-transparent hover:bg-[#111827] hover:border-[#1f2937] transition-colors" onClick={handleExportFile} title="Export CSV">
          <Download className="h-5 w-5 text-slate-300" />
        </button>
        <button className="p-2 rounded-md border border-transparent hover:bg-[#111827] hover:border-[#1f2937] transition-colors" onClick={handleSaveProject} title="Save Project">
          <FolderOpen className="h-5 w-5 text-slate-300" />
        </button>
        <button className="p-2 rounded-md border border-transparent hover:bg-[#111827] hover:border-[#1f2937] transition-colors">
          <Play className="h-5 w-5 text-slate-300" />
        </button>
        <button className="p-2 rounded-md border border-transparent hover:bg-[#111827] hover:border-[#1f2937] transition-colors">
          <LayoutGrid className="h-5 w-5 text-slate-300" />
        </button>
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#1f2937] bg-[#101010]">
            {user.picture ? (
              <img src={user.picture} alt={userName} className="h-7 w-7 rounded-full object-cover border border-[#334155]" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-[#1f2937] text-slate-200 flex items-center justify-center text-xs font-semibold">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-slate-200 truncate max-w-[120px]">{userName}</p>
              <p className="text-[10px] text-slate-500">Logged in</p>
            </div>
          </div>
        ) : (
          <Link
            to="/login?mode=login"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1f2937] bg-[#101010] text-xs font-medium text-slate-200 hover:bg-[#111827] transition-colors"
          >
            <User className="h-4 w-4" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
