// src/components/Header.tsx
import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { Search, Menu, X, LogOut, User, Settings } from "lucide-react"

const Header: React.FC = () => {
  const location = useLocation()
  const pathname = location?.pathname ?? "/"
  const { user, isAuthenticated, logout } = useAuth0()

  const [navOpen, setNavOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const mobileNavRef = useRef<HTMLDivElement | null>(null)

  // avatar state: "loading" | "ok" | "error" | "absent"
  const [avatarState, setAvatarState] = useState<"loading" | "ok" | "error" | "absent">(
    user?.picture ? "loading" : "absent",
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.picture ?? null)

  // derive two-letter initials (first 2 letters of name OR first two of email local-part)
  const getTwoLetterInitials = () => {
    const name = user?.name?.trim()
    if (name && name.length > 0) {
      const parts = name.split(/\s+/)
      // try first two characters of first + last name if available, else first two chars of the single name
      if (parts.length >= 2) {
        const first = parts[0].charAt(0)
        const last = parts[parts.length - 1].charAt(0)
        return (first + last).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    const email = user?.email ?? ""
    const local = email.split("@")[0] || ""
    return local.substring(0, 2).toUpperCase() || "U"
  }

  // Preload avatar image to detect if it's valid.
  useEffect(() => {
    if (!user?.picture) {
      setAvatarState("absent")
      setAvatarUrl(null)
      return
    }

    let active = true
    setAvatarState("loading")
    const img = new Image()
    img.src = user.picture

    img.onload = () => {
      if (!active) return
      setAvatarUrl(user.picture ?? null)
      setAvatarState("ok")
    }
    img.onerror = () => {
      if (!active) return
      setAvatarUrl(null)
      setAvatarState("error")
    }

    return () => {
      active = false
    }
  }, [user?.picture])

  // close dropdown / mobile nav when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
      if (navOpen && mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        const menuButton = document.getElementById("menu-toggle-btn")
        if (menuButton && !menuButton.contains(target)) setNavOpen(false)
      }
    }

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false)
        setNavOpen(false)
      }
    }

    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [dropdownOpen, navOpen])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement real search routing if desired
    alert(`Searching for: ${searchInput}`)
  }

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: typeof window !== "undefined" ? window.location.origin : "",
      },
    })
  }

  const isHomePage = pathname === "/"

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-black text-white px-6 py-3 flex justify-between items-center z-50 shadow-md border-b border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <img
            className="w-8 h-8 rounded-lg object-cover"
            src="/assets/logo.png"
            alt="DATABits logo"
            onError={(e) => {
              // fallback to nothing — text logo still shows
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
            }}
          />
          <Link to="/" className="text-white">
            DATABits
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 ml-6 hidden md:block" aria-label="Main navigation">
          <ul className="flex gap-6 list-none m-0 p-0">
            {!isHomePage && (
              <li>
                <Link to="/" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-medium">
                  Home
                </Link>
              </li>
            )}
            <li>
              <Link to="/features" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-medium">
                Features
              </Link>
            </li>
            <li>
              <Link to="/docs" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-medium">
                Docs
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-medium">
                Community
              </Link>
            </li>
            <li>
              <Link to="/enterprise" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-medium">
                Enterprise
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="text-white hover:text-green-400 transition-colors duration-200 text-base font-lg">
                Pricing
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none text-white text-sm w-48 placeholder-gray-500"
              placeholder="Search..."
            />
            <button type="submit" className="bg-blue-900 bg-opacity-30 text-gray-400 hover:text-green-400 transition-colors p-1 rounded" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          <div className="flex items-center gap-3" ref={dropdownRef}>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((s) => !s)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-900 transition-colors duration-200"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  {/* Avatar: show preloaded image when ok, else gradient initials */}
                  {avatarState === "ok" && avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name || user.email || "User avatar"}
                      className="w-8 h-8 rounded-full object-cover border border-green-400"
                      onError={() => {
                        // fallback if browser fails after preload
                        setAvatarState("error")
                        setAvatarUrl(null)
                      }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
                      }}
                      aria-hidden
                    >
                      {getTwoLetterInitials()}
                    </div>
                  )}

                  <span className="text-sm font-medium text-gray-300 hidden sm:inline max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white">{user.name || "User"}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                      <User size={16} />
                      Profile Settings
                    </Link>
                    <Link to="/account" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors border-b border-gray-700">
                      <Settings size={16} />
                      Account
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-gray-800 hover:text-red-400 transition-colors">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {/* Navigate to the login page (separate route) */}
                <Link to="/login?mode=login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm">
                  Sign In
                </Link>
                <Link to="/login?mode=signup" className="px-4 py-2 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-black transition-colors disabled:opacity-50 text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button id="menu-toggle-btn" className="md:hidden bg-transparent border-none cursor-pointer text-white" onClick={() => setNavOpen((s) => !s)} aria-label={navOpen ? "Close menu" : "Open menu"} aria-expanded={navOpen}>
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <div ref={mobileNavRef} className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${navOpen ? "max-h-screen" : "max-h-0"}`}>
        <div className="px-4 pb-4 pt-2 space-y-3 bg-black border-t border-gray-800">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg">
            <Search size={16} className="text-gray-400" />
            <input type="text" value={searchInput} onChange={handleSearchChange} className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-400 w-full" placeholder="Search..." />
            <button type="submit" className="px-2 py-1 rounded-md bg-blue-600 text-white text-sm">Go</button>
          </form>

          <nav className="flex flex-col gap-1">
            {!isHomePage && (<Link to="/" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Home</Link>)}
            <Link to="/features" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Features</Link>
            <Link to="/docs" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Docs</Link>
            <Link to="/community" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Community</Link>
            <Link to="/enterprise" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Enterprise</Link>
            <Link to="/pricing" className="text-gray-200 px-3 py-2 rounded-md hover:bg-gray-800">Pricing</Link>
          </nav>

          <div className="pt-2 border-t border-gray-800">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-semibold">{getTwoLetterInitials()}</div>
                  <div>
                    <div className="text-gray-100 font-medium text-sm">{user.name || user.email}</div>
                    <div className="text-gray-400 text-xs truncate">{user.email}</div>
                  </div>
                </div>
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-md"><User size={16}/> Profile</Link>
                <Link to="/account" className="flex items-center gap-3 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-md"><Settings size={16}/> Account</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-md flex items-center gap-3"><LogOut size={16}/> Sign out</button>
              </div>
            ) : (
              <div className="flex gap-2 px-3">
                <Link to="/login?mode=login" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md">Sign In</Link>
                <Link to="/login?mode=signup" className="flex-1 px-3 py-2 border border-gray-700 text-gray-200 rounded-md">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Header
