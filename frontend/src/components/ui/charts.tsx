"use client"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

interface ChartProps {
  data: { name: string; value: number }[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export function BarChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
        <YAxis stroke="#9ca3af" fontSize={10} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            color: "#fff",
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export function LineChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
        <YAxis stroke="#9ca3af" fontSize={10} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            color: "#fff",
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export function PieChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={30}
          outerRadius={50}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            color: "#fff",
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
