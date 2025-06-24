import { type NextRequest, NextResponse } from "next/server"
import { createTransaction } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.date || !body.type || !body.category || !body.budget || !body.amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate type
    if (!["ingreso", "egreso"].includes(body.type)) {
      return NextResponse.json({ error: 'Type must be either "ingreso" or "egreso"' }, { status: 400 })
    }

    // Validate numbers
    if (isNaN(body.budget) || isNaN(body.amount) || body.budget < 0 || body.amount < 0) {
      return NextResponse.json({ error: "Budget and amount must be positive numbers" }, { status: 400 })
    }

    const transaction = await createTransaction({
      date: body.date,
      type: body.type,
      category: body.category.toUpperCase(),
      concept: body.concept,
      budget: Number.parseFloat(body.budget),
      amount: Number.parseFloat(body.amount),
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
