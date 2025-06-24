"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { TransactionsFilters } from "@/components/transaction-filters"
import { TransactionsTable } from "@/components/transactions-table"
import { TransactionDialog } from "@/components/transaction-dialog"
import type { Transaction } from "@/lib/db"

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function RegistrosPage() {
  const [data, setData] = useState<TransactionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchTransactions = useCallback(async (page = 1, currentFilters: Record<string, string> = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...currentFilters,
      })

      const response = await fetch(`/api/transactions/all?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions(currentPage, filters)
  }, [fetchTransactions, currentPage, filters])

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = () => {
    fetchTransactions(currentPage, filters)
  }

  const handleNewTransaction = () => {
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    handleRefresh()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Registros</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestión de Transacciones</h2>
            <p className="text-muted-foreground">Administra, edita y elimina todas tus transacciones financieras</p>
          </div>
          <Button onClick={handleNewTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Encuentra rápidamente las transacciones que necesitas</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsFilters onFiltersChange={handleFiltersChange} loading={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todas las Transacciones</CardTitle>
                <CardDescription>
                  {data ? `${data.total} transacciones encontradas` : "Cargando transacciones..."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionsTable
              transactions={data?.transactions || []}
              loading={loading}
              pagination={{
                page: data?.page || 1,
                totalPages: data?.totalPages || 1,
                total: data?.total || 0,
              }}
              onPageChange={handlePageChange}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </main>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleDialogSuccess} />
    </div>
  )
}
