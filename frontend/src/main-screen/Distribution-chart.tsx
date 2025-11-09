"use client"

import React, { useRef, useEffect } from "react"

interface DistributionChartProps {
  data?: Array<{
    bin?: string
    count?: number
    binStart?: number
    binEnd?: number
    value?: number
  }>
  beforeColor?: string
  afterColor?: string
}

// Utility to parse an "rgb(r, g, b)" string into [r, g, b]
function parseRGB(color: string): [number, number, number] | null {
  const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (!match) return null
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

export function DistributionChart({
  data = [],
  beforeColor = "rgb(59, 130, 246)",
  afterColor = "rgb(20, 184, 166)",
}: DistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // HiDPI support
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * 2
    canvas.height = height * 2
    ctx.scale(2, 2)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Determine points
    const points = data.length
      ? data.map((p) => ({ bin: p.bin ?? "", count: p.count ?? 0 }))
      : []

    // If no data, draw default normal distributions
    const hasData = points.length > 0
    let bins = points
    if (!hasData) {
      // generate placeholder bins
      bins = Array.from({ length: 50 }, (_, i) => ({
        bin: i.toString(),
        count: Math.exp(-Math.pow(i - 25, 2) / (2 * Math.pow(8, 2))),
      }))
    }

    // Normalize counts
    const maxCount = Math.max(...bins.map((b) => b.count)) || 1
    const pointWidth = width / bins.length

    // Helper to get RGBA stops
    const makeStops = (color: string) => {
      const rgb = parseRGB(color) || [0, 0, 0]
      return [
        `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`,
        `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`,
      ]
    }

    // Draw a single curve
    const drawCurve = (
      factor: number,
      color: string,
      offset?: number
    ) => {
      ctx.beginPath()
      ctx.moveTo(0, height)
      bins.forEach((b, i) => {
        const x = i * pointWidth + (offset || 0)
        const h = (b.count / maxCount) * height * factor
        const y = height - h
        ctx.lineTo(x, y)
      })
      ctx.lineTo(width, height)
      ctx.closePath()

      // Fill gradient
      const [start, end] = makeStops(color)
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, start)
      grad.addColorStop(1, end)
      ctx.fillStyle = grad
      ctx.fill()

      // Stroke
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // First curve
    drawCurve(0.8, beforeColor)
    // Second curve (slightly offset/factor)
    drawCurve(0.6, afterColor, pointWidth / 4)

  }, [data, beforeColor, afterColor])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}
