"use client"

import { useState, useEffect } from "react"
import { Eye, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MonthSelector } from "@/components/month-selector"
import { FinancialTable } from "@/components/financial-table"
import { FinancialChart } from "@/components/financial-chart"
import type { MonthlyData } from "@/lib/db"

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [data, setData] = useState<MonthlyData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async (year: number, month: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/monthly?year=${year}&month=${month}`)
      if (response.ok) {
        const monthlyData = await response.json()
        setData(monthlyData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPercentageColor = (percentage: number) => {
    return percentage >= 50 ? "text-red-600" : "text-green-600"
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Veo mi dinero</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h2>
            <p className="text-muted-foreground">Resumen de tus finanzas personales</p>
          </div>
          <MonthSelector selectedYear={selectedYear} selectedMonth={selectedMonth} onDateChange={handleDateChange} />
        </div>

        {/* Resumen financiero */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data ? formatCurrency(data.totalIngresos) : "$0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data ? formatCurrency(data.totalEgresos) : "$0"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Restante</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data && data.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                {data ? formatCurrency(data.saldo) : "$0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data ? getPercentageColor(data.porcentajeGastos) : ""}`}>
                {data ? `${data.porcentajeGastos.toFixed(1)}%` : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consejo dinámico */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle>Consejo Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Tus gastos básicos son el{" "}
                <span className={`font-bold ${getPercentageColor(data.porcentajeGastos)}`}>
                  {data.porcentajeGastos.toFixed(1)}%
                </span>{" "}
                de tus ingresos totales.
                {data.porcentajeGastos >= 50 ? (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    💡 Considera revisar tus gastos para mantener un mejor equilibrio financiero.
                  </span>
                ) : (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    ✅ ¡Excelente! Mantienes un buen control de tus gastos.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tablas y gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
              <CardDescription>Detalle de ingresos por categoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data && (
                <>
                  <FinancialTable data={data.ingresos} title="" type="ingreso" />
                  {data.ingresos.length > 0 && <FinancialChart data={data.ingresos} type="ingreso" />}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Egresos</CardTitle>
              <CardDescription>Detalle de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data && (
                <>
                  <FinancialTable data={data.egresos} title="" type="egreso" />
                  {data.egresos.length > 0 && <FinancialChart data={data.egresos} type="egreso" />}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
