"use client"

import { useEffect, useState } from "react"
import { Progress } from "./progress.tsx"
import { Button } from "./button.tsx"
import { X, Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  isVisible: boolean
  title?: string
  message?: string
  progress?: number
  canCancel?: boolean
  onCancel?: () => void
}

export function LoadingOverlay({
  isVisible,
  title = "Processing",
  message = "Please wait...",
  progress,
  canCancel = false,
  onCancel,
}: LoadingOverlayProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {canCancel && onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-gray-300">
            {message}
            {dots}
          </span>
        </div>

        {typeof progress === "number" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-300">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!progress && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
