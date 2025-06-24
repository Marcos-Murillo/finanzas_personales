"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Save, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"

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

export default function FinanzasPage() {
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<"ingreso" | "egreso" | "">("")
  const router = useRouter()
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
      date: new Date().toISOString().split("T")[0],
      type: undefined,
      category: "",
      concept: "",
      budget: "",
      amount: "",
    },
  })

  const watchedType = watch("type")

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
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
          description: "Transacción registrada correctamente",
        })
        reset()
        setSelectedType("")
        router.push("/")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al registrar la transacción",
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

  const handleCancel = () => {
    reset()
    setSelectedType("")
    router.push("/")
  }

  const handleTypeChange = (value: "ingreso" | "egreso") => {
    setSelectedType(value)
    setValue("type", value)
    setValue("category", "") // Reset category when type changes
  }

  const categories = selectedType === "ingreso" ? ingresoCategories : selectedType === "egreso" ? egresoCategories : []

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Mis finanzas</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Registrar Movimiento</h2>
            <p className="text-muted-foreground">Ingresa los detalles de tu transacción financiera</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nueva Transacción</CardTitle>
              <CardDescription>Completa todos los campos obligatorios para registrar tu movimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Input id="date" type="date" {...register("date", { required: "La fecha es obligatoria" })} />
                    {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select onValueChange={handleTypeChange} value={selectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-600">El tipo es obligatorio</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  {selectedType ? (
                    <Select onValueChange={(value) => setValue("category", value)}>
                      <SelectTrigger>
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
                    <Input id="category" placeholder="Primero selecciona el tipo" disabled />
                  )}
                  {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concept">Concepto</Label>
                  <Textarea
                    id="concept"
                    placeholder="Describe brevemente el concepto (opcional)"
                    {...register("concept")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Presupuesto *</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("budget", {
                        required: "El presupuesto es obligatorio",
                        min: { value: 0, message: "El presupuesto debe ser positivo" },
                      })}
                    />
                    {errors.budget && <p className="text-sm text-red-600">{errors.budget.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto Real *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("amount", {
                        required: "El monto es obligatorio",
                        min: { value: 0, message: "El monto debe ser positivo" },
                      })}
                    />
                    {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ejemplos de Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Ingresos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• MONITORIA - Clases particulares</li>
                    <li>• RAUFOLL - Trabajo medio tiempo</li>
                    <li>• TRABAJOS EXTRA - Freelance</li>
                    <li>• BONOS - Bonificaciones</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Egresos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• SERVICIOS - Luz, agua, gas</li>
                    <li>• ARRIENDO - Vivienda</li>
                    <li>• TRANSPORTE - Movilidad</li>
                    <li>• MERCADO - Alimentación</li>
                    <li>• DEUDA - Pagos de deudas</li>
                    <li>• AHORRO - Dinero ahorrado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
