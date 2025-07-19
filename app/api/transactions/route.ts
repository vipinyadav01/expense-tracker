import { auth } from "@clerk/nextjs/server"
import { supabase, ensureUserExists } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in Supabase
    await ensureUserExists(userId)

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in Supabase
    await ensureUserExists(userId)

    const body = await request.json()
    const { amount, description, category_id, transaction_date, type } = body

    // Validation
    if (!amount || !description || !category_id || !transaction_date || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          amount: Number.parseFloat(amount),
          description,
          category_id,
          transaction_date,
          type,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
