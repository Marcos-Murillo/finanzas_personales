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

export async function getAllTransactions(
  limit?: number,
  offset?: number,
  filters?: {
    type?: "ingreso" | "egreso"
    category?: string
    startDate?: string
    endDate?: string
    search?: string
  },
): Promise<{ transactions: Transaction[]; total: number }> {
  // Build the base query
  const whereConditions: string[] = []
  let queryParams: any[] = []

  // Apply filters
  if (filters?.type) {
    whereConditions.push(`type = $${queryParams.length + 1}`)
    queryParams.push(filters.type)
  }

  if (filters?.category) {
    whereConditions.push(`category ILIKE $${queryParams.length + 1}`)
    queryParams.push(`%${filters.category}%`)
  }

  if (filters?.startDate) {
    whereConditions.push(`date >= $${queryParams.length + 1}`)
    queryParams.push(filters.startDate)
  }

  if (filters?.endDate) {
    whereConditions.push(`date <= $${queryParams.length + 1}`)
    queryParams.push(filters.endDate)
  }

  if (filters?.search) {
    whereConditions.push(`(category ILIKE $${queryParams.length + 1} OR concept ILIKE $${queryParams.length + 1})`)
    queryParams.push(`%${filters.search}%`)
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM transactions ${whereClause}`
  let countResult: any[]

  if (queryParams.length > 0) {
    // Use template literal with spread for parameters
    const placeholders = queryParams.map((_, i) => `$${i + 1}`).join(", ")
    countResult =
      await sql`SELECT COUNT(*) as count FROM transactions ${whereClause ? sql.unsafe(whereClause.replace(/\$\d+/g, () => queryParams.shift())) : sql``}`

    // Reset queryParams for the main query
    queryParams = []
    if (filters?.type) queryParams.push(filters.type)
    if (filters?.category) queryParams.push(`%${filters.category}%`)
    if (filters?.startDate) queryParams.push(filters.startDate)
    if (filters?.endDate) queryParams.push(filters.endDate)
    if (filters?.search) queryParams.push(`%${filters.search}%`)
  } else {
    countResult = await sql`SELECT COUNT(*) as count FROM transactions`
  }

  const total = Number(countResult[0].count)

  // Build main query with ordering, limit and offset
  let mainQuery = `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, created_at DESC`

  if (limit) {
    mainQuery += ` LIMIT ${limit}`
  }

  if (offset) {
    mainQuery += ` OFFSET ${offset}`
  }

  let transactions: any[]

  if (queryParams.length > 0) {
    // For complex queries with parameters, we'll use a simpler approach
    // Let's rebuild this with individual conditions
    let baseQuery = sql`SELECT * FROM transactions WHERE 1=1`

    if (filters?.type) {
      baseQuery = sql`${baseQuery} AND type = ${filters.type}`
    }

    if (filters?.category) {
      baseQuery = sql`${baseQuery} AND category ILIKE ${`%${filters.category}%`}`
    }

    if (filters?.startDate) {
      baseQuery = sql`${baseQuery} AND date >= ${filters.startDate}`
    }

    if (filters?.endDate) {
      baseQuery = sql`${baseQuery} AND date <= ${filters.endDate}`
    }

    if (filters?.search) {
      baseQuery = sql`${baseQuery} AND (category ILIKE ${`%${filters.search}%`} OR concept ILIKE ${`%${filters.search}%`})`
    }

    baseQuery = sql`${baseQuery} ORDER BY date DESC, created_at DESC`

    if (limit) {
      baseQuery = sql`${baseQuery} LIMIT ${limit}`
    }

    if (offset) {
      baseQuery = sql`${baseQuery} OFFSET ${offset}`
    }

    transactions = await baseQuery
  } else {
    if (limit && offset) {
      transactions =
        await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    } else if (limit) {
      transactions = await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ${limit}`
    } else {
      transactions = await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC`
    }
  }

  return {
    transactions: transactions as Transaction[],
    total,
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

export async function updateTransaction(
  id: number,
  transaction: Partial<Omit<Transaction, "id" | "created_at" | "updated_at">>,
) {
  const result = await sql`
    UPDATE transactions 
    SET 
      date = COALESCE(${transaction.date}, date),
      type = COALESCE(${transaction.type}, type),
      category = COALESCE(${transaction.category}, category),
      concept = COALESCE(${transaction.concept}, concept),
      budget = COALESCE(${transaction.budget}, budget),
      amount = COALESCE(${transaction.amount}, amount),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0]
}

export async function deleteTransaction(id: number) {
  const result = await sql`
    DELETE FROM transactions 
    WHERE id = ${id}
    RETURNING *
  `
  return result[0]
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const result = await sql`
    SELECT * FROM transactions 
    WHERE id = ${id}
  `
  return (result[0] as Transaction) || null
}

export { sql }
