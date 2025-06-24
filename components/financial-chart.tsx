"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { CategoryData } from "@/lib/db"

interface FinancialChartProps {
  data: CategoryData[]
  type: "ingreso" | "egreso"
}

export function FinancialChart({ data, type }: FinancialChartProps) {
  const chartData = data.map((item) => ({
    category: item.category,
    presupuesto: item.budget,
    monto: item.amount,
  }))

  const color = type === "ingreso" ? "#22c55e" : "#ef4444"

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} fontSize={12} />
          <Tooltip
            formatter={(value: number) => [
              `$${value.toLocaleString()}`,
              value === chartData[0]?.presupuesto ? "Presupuesto" : "Monto",
            ]}
            labelFormatter={(label) => `Categoría: ${label}`}
          />
          <Bar dataKey="presupuesto" fill={`${color}80`} name="Presupuesto" />
          <Bar dataKey="monto" fill={color} name="Monto" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
