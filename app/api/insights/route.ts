import { auth } from "@clerk/nextjs/server"
import { supabase, ensureUserExists } from "@/lib/supabase"
import { generateFinancialInsights } from "@/lib/gemini"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in Supabase
    await ensureUserExists(userId)

    // Fetch user's transactions
    const { data: transactions, error: transactionsError } = await supabase
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

    // Fetch user's budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
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

    // Handle database errors gracefully
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
    }
    if (budgetsError) {
      console.error("Error fetching budgets:", budgetsError)
    }

    // Use empty arrays if data fetch failed
    const safeTransactions = transactions || []
    const safeBudgets = budgets || []

    // Generate insights with available data
    const insights = await generateFinancialInsights(safeTransactions, safeBudgets)
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error generating insights:", error)
    
    // Return helpful fallback insights instead of generic error
    const fallbackInsights = {
      summary: "We're having trouble accessing your data right now, but here are some general financial tips to get you started.",
      topCategories: [
        "Track your daily expenses to identify spending patterns",
        "Review your bank statements to categorize expenses",
        "Set up a simple budget to monitor your spending"
      ],
      savingTips: [
        "Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings",
        "Automate your savings to build the habit",
        "Review and cancel unused subscriptions"
      ],
      budgetRecommendations: [
        "Begin by tracking expenses for one month",
        "Set realistic budget limits for each category",
        "Review and adjust your budget monthly"
      ]
    }
    
    return NextResponse.json(fallbackInsights)
  }
}
