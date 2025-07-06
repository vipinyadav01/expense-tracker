import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export async function generateFinancialInsights(transactions: any[], budgets: any[]) {
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const categorySpending = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const category = t.categories?.name || "Other"
        acc[category] = (acc[category] || 0) + Number.parseFloat(t.amount)
        return acc
      },
      {} as Record<string, number>,
    )

  // Generate fallback insights based on transaction data
  const generateFallbackInsights = () => {
    const netIncome = totalIncome - totalExpenses
    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    let summary = ""
    if (totalExpenses === 0) {
      summary = "No expenses recorded yet. Start tracking your spending to get personalized insights."
    } else if (netIncome > 0) {
      summary = `You're doing great! You've saved ₹${netIncome.toFixed(2)} this period. Your total expenses are ₹${totalExpenses.toFixed(2)} against income of ₹${totalIncome.toFixed(2)}.`
    } else if (netIncome < 0) {
      summary = `You're spending ₹${Math.abs(netIncome).toFixed(2)} more than your income. Consider reviewing your expenses to improve your financial health.`
    } else {
      summary = `You're breaking even with ₹${totalExpenses.toFixed(2)} in expenses. Look for opportunities to save and build an emergency fund.`
    }

    const topCategoriesAnalysis = topCategories.map(([category, amount], index) => {
      const percentage = ((amount / totalExpenses) * 100).toFixed(1)
      return `${category} accounts for ${percentage}% of your spending (₹${amount.toFixed(2)})`
    })

    const savingTips = [
      "Set up automatic transfers to a savings account",
      "Review and cancel unused subscriptions",
      "Use the 50/30/20 budgeting rule (50% needs, 30% wants, 20% savings)",
      "Cook at home more often to reduce food expenses",
      "Compare prices before making large purchases"
    ]

    const budgetRecommendations = [
      "Create monthly budgets for your top spending categories",
      "Set aside 20% of your income for savings and investments",
      "Build an emergency fund covering 3-6 months of expenses",
      "Track your daily expenses to identify spending patterns",
      "Review your budget monthly and adjust as needed"
    ]

    return {
      summary,
      topCategories: topCategoriesAnalysis,
      savingTips: savingTips.slice(0, 3),
      budgetRecommendations: budgetRecommendations.slice(0, 3)
    }
  }

  // If no API key or no transactions, return fallback insights
  if (!genAI || transactions.length === 0) {
    return generateFallbackInsights()
  }

  const prompt = `
    Analyze the following financial data and provide insights:
    
    Total Income: ₹${totalIncome.toFixed(2)}
    Total Expenses: ₹${totalExpenses.toFixed(2)}
    Net Income: ₹${(totalIncome - totalExpenses).toFixed(2)}
    
    Spending by Category:
    ${Object.entries(categorySpending)
      .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)}`)
      .join("\n")}
    
    Budget Information:
    ${budgets.map((b) => `${b.categories?.name}: ₹${b.amount} (${b.period})`).join("\n")}
    
    Please provide:
    1. A brief financial summary (2-3 sentences)
    2. Top 3 spending categories analysis
    3. 3 personalized money-saving tips
    4. Budget recommendations
    
    Keep the response concise and actionable. Format as JSON with keys: summary, topCategories, savingTips, budgetRecommendations.
  `

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to parse JSON, fallback to structured insights if parsing fails
    try {
      const parsed = JSON.parse(text)
      return parsed
    } catch {
      return generateFallbackInsights()
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    // Return fallback insights instead of error message
    return generateFallbackInsights()
  }
}
