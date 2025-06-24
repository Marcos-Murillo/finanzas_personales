"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/db"

interface TransactionDialogProps {
  transaction?: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  date: string
  type: "ingreso" | "egreso"
  category: string
  concept: string
  budget: string
  amount: string
}

const ingresoCategories = ["MONITORIA", "RAUFOLL", "TRABAJOS EXTRA", "BONOS", "OTROS INGRESOS"]
const egresoCategories = [
  "SERVICIOS",
  "ARRIENDO",
  "TRANSPORTE",
  "MERCADO",
  "DEUDA",
  "AHORRO",
  "COSITAS",
  "SALUD",
  "EDUCACION",
]

export function TransactionDialog({ transaction, open, onOpenChange, onSuccess }: TransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<"ingreso" | "egreso" | "">(transaction?.type || "")
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      date: transaction?.date || new Date().toISOString().split("T")[0],
      type: transaction?.type,
      category: transaction?.category || "",
      concept: transaction?.concept || "",
      budget: transaction?.budget?.toString() || "",
      amount: transaction?.amount?.toString() || "",
    },
  })

  const watchedType = watch("type")

  useEffect(() => {
    if (transaction) {
      setValue("date", transaction.date)
      setValue("type", transaction.type)
      setValue("category", transaction.category)
      setValue("concept", transaction.concept || "")
      setValue("budget", transaction.budget.toString())
      setValue("amount", transaction.amount.toString())
      setSelectedType(transaction.type)
    } else {
      reset({
        date: new Date().toISOString().split("T")[0],
        type: undefined,
        category: "",
        concept: "",
        budget: "",
        amount: "",
      })
      setSelectedType("")
    }
  }, [transaction, setValue, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions"
      const method = transaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: data.date,
          type: data.type,
          category: data.category,
          concept: data.concept || null,
          budget: Number.parseFloat(data.budget),
          amount: Number.parseFloat(data.amount),
        }),
      })

      if (response.ok) {
        toast({
          title: "¡Éxito!",
          description: transaction ? "Transacción actualizada correctamente" : "Transacción creada correctamente",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al procesar la transacción",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (value: "ingreso" | "egreso") => {
    setSelectedType(value)
    setValue("type", value)
    setValue("category", "") // Reset category when type changes
  }

  const categories = selectedType === "ingreso" ? ingresoCategories : selectedType === "egreso" ? egresoCategories : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar Transacción" : "Nueva Transacción"}</DialogTitle>
          <DialogDescription>
            {transaction
              ? "Modifica los datos de la transacción"
              : "Completa los datos para crear una nueva transacción"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Fecha *
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                {...register("date", { required: "La fecha es obligatoria" })}
              />
            </div>
            {errors.date && <p className="text-sm text-red-600 col-span-4">{errors.date.message}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo *
              </Label>
              <Select onValueChange={handleTypeChange} value={selectedType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría *
              </Label>
              {selectedType ? (
                <Select onValueChange={(value) => setValue("category", value)} value={watch("category")}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="col-span-3" placeholder="Primero selecciona el tipo" disabled />
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concept" className="text-right">
                Concepto
              </Label>
              <Textarea
                id="concept"
                placeholder="Describe el concepto (opcional)"
                className="col-span-3"
                {...register("concept")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget" className="text-right">
                Presupuesto *
              </Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="col-span-3"
                {...register("budget", {
                  required: "El presupuesto es obligatorio",
                  min: { value: 0, message: "El presupuesto debe ser positivo" },
                })}
              />
            </div>
            {errors.budget && <p className="text-sm text-red-600 col-span-4">{errors.budget.message}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="col-span-3"
                {...register("amount", {
                  required: "El monto es obligatorio",
                  min: { value: 0, message: "El monto debe ser positivo" },
                })}
              />
            </div>
            {errors.amount && <p className="text-sm text-red-600 col-span-4">{errors.amount.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : transaction ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
