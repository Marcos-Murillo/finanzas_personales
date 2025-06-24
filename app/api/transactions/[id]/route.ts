import { type NextRequest, NextResponse } from "next/server"
import { updateTransaction, deleteTransaction, getTransactionById } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    const transaction = await getTransactionById(id)

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    // Validate type if provided
    if (body.type && !["ingreso", "egreso"].includes(body.type)) {
      return NextResponse.json({ error: 'Type must be either "ingreso" or "egreso"' }, { status: 400 })
    }

    // Validate numbers if provided
    if (body.budget !== undefined && (isNaN(body.budget) || body.budget < 0)) {
      return NextResponse.json({ error: "Budget must be a positive number" }, { status: 400 })
    }

    if (body.amount !== undefined && (isNaN(body.amount) || body.amount < 0)) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }

    const updateData: any = {}
    if (body.date) updateData.date = body.date
    if (body.type) updateData.type = body.type
    if (body.category) updateData.category = body.category.toUpperCase()
    if (body.concept !== undefined) updateData.concept = body.concept
    if (body.budget !== undefined) updateData.budget = Number.parseFloat(body.budget)
    if (body.amount !== undefined) updateData.amount = Number.parseFloat(body.amount)

    const transaction = await updateTransaction(id, updateData)

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    const transaction = await deleteTransaction(id)

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
