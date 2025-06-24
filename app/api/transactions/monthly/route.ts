import { type NextRequest, NextResponse } from "next/server"
import { getTransactionsByMonth } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = Number.parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year or month" }, { status: 400 })
    }

    const data = await getTransactionsByMonth(year, month)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching monthly data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
