import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

export interface Transaction {
  id: number
  date: string
  type: "ingreso" | "egreso"
  category: string
  concept?: string
  budget: number
  amount: number
  created_at: string
  updated_at: string
}

export interface MonthlyData {
  ingresos: CategoryData[]
  egresos: CategoryData[]
  totalIngresos: number
  totalEgresos: number
  saldo: number
  porcentajeGastos: number
}

export interface CategoryData {
  category: string
  budget: number
  amount: number
}

export async function getTransactionsByMonth(year: number, month: number): Promise<MonthlyData> {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
  // Get the real last day of the month (pass 0 as the day for the next month)
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`

  const transactions = await sql`
    SELECT * FROM transactions 
    WHERE date >= ${startDate} AND date <= ${endDate}
    ORDER BY date DESC
  `

  const ingresos: CategoryData[] = []
  const egresos: CategoryData[] = []

  // Group by category and type
  const groupedData = transactions.reduce((acc: any, transaction: any) => {
    const key = `${transaction.type}-${transaction.category}`
    if (!acc[key]) {
      acc[key] = {
        type: transaction.type,
        category: transaction.category,
        budget: 0,
        amount: 0,
      }
    }
    acc[key].budget += Number(transaction.budget)
    acc[key].amount += Number(transaction.amount)
    return acc
  }, {})

  Object.values(groupedData).forEach((item: any) => {
    const categoryData = {
      category: item.category,
      budget: item.budget,
      amount: item.amount,
    }

    if (item.type === "ingreso") {
      ingresos.push(categoryData)
    } else {
      egresos.push(categoryData)
    }
  })

  const totalIngresos = ingresos.reduce((sum, item) => sum + item.amount, 0)
  const totalEgresos = egresos.reduce((sum, item) => sum + item.amount, 0)
  const saldo = totalIngresos - totalEgresos
  const porcentajeGastos = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0

  return {
    ingresos,
    egresos,
    totalIngresos,
    totalEgresos,
    saldo,
    porcentajeGastos,
  }
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) {
  const result = await sql`
    INSERT INTO transactions (date, type, category, concept, budget, amount)
    VALUES (${transaction.date}, ${transaction.type}, ${transaction.category}, ${transaction.concept || null}, ${transaction.budget}, ${transaction.amount})
    RETURNING *
  `
  return result[0]
}

export { sql }
