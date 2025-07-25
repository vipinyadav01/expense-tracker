import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Type Definitions for Clarity and Safety ---
// It's good practice to define the shape of your data.
interface Category {
  name: string;
}

interface Transaction {
  type: 'income' | 'expense';
  amount: string; // Assuming amount can be a string from a DB/API
  categories?: Category;
}

interface Budget {
  amount: number;
  period: string;
  categories?: Category;
}

// Defines the structure for both AI-generated and fallback insights.
export interface FinancialInsights {
  summary: string;
  topCategories: string[];
  savingTips: string[];
  budgetRecommendations: string[];
}

// --- Gemini API Initialization ---
// Initialize the Generative AI client if the API key is available.
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generates financial insights from transaction and budget data.
 *
 * It first attempts to use the Gemini AI for personalized insights.
 * If the AI call fails or is unavailable, it returns a set of pre-defined fallback insights.
 *
 * @param transactions - An array of user transaction objects.
 * @param budgets - An array of user budget objects.
 * @returns A promise that resolves to a FinancialInsights object.
 */
export async function generateFinancialInsights(transactions: any[], budgets: any[]): Promise<FinancialInsights> {
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + Number.parseFloat(t.amount.toString()), 0)

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum: number, t: any) => sum + Number.parseFloat(t.amount.toString()), 0)

  const categorySpending = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc: Record<string, number>, t: any) => {
        const category = t.categories?.name || "Other"
        acc[category] = (acc[category] || 0) + Number.parseFloat(t.amount.toString())
        return acc
      },
      {} as Record<string, number>,
    )

  // Generate fallback insights based on transaction data
  const generateFallbackInsights = () => {
    const netIncome = totalIncome - totalExpenses
    const topCategories = Object.entries(categorySpending)
      .sort(([,a]: [string, number], [,b]: [string, number]) => (b as number) - (a as number))
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
      const amt = amount as number
      const percentage = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : "0"
      return `${category} is your #${index + 1} expense category with ₹${amt.toFixed(2)} spent (${percentage}% of total spending)`
    })

    // Personalized saving tips based on actual data
    const savingTips = []
    if (categorySpending["Food & Dining"] > 0) {
      savingTips.push("Consider cooking at home more often to reduce food expenses")
    }
    if (categorySpending["Entertainment"] > 0) {
      savingTips.push("Look for free or low-cost entertainment alternatives")
    }
    if (categorySpending["Shopping"] > 0) {
      savingTips.push("Create a shopping list and stick to it to avoid impulse purchases")
    }
    
    // Add generic tips if no specific categories found
    if (savingTips.length === 0) {
      savingTips.push("Set up automatic transfers to a savings account")
      savingTips.push("Review and cancel unused subscriptions")
      savingTips.push("Use the 50/30/20 budgeting rule")
    }

    const budgetRecommendations = [
      "Create monthly budgets for your top spending categories",
      "Set aside 20% of your income for savings and investments",
      "Track your daily expenses to identify spending patterns"
    ]

    return {
      summary,
      topCategories: topCategoriesAnalysis.length > 0 ? topCategoriesAnalysis : ["Add some transactions to see spending analysis"],
      savingTips: savingTips.slice(0, 3),
      budgetRecommendations: budgetRecommendations.slice(0, 3)
    }
  }

  // If no API key or no transactions, return fallback insights
  if (!genAI) {
    return generateFallbackInsights()
  }

  if (transactions.length === 0) {
    return generateFallbackInsights()
  }

  const prompt = `
    You are a helpful financial advisor AI. Analyze this Indian user's financial data and provide personalized insights.
    
    Financial Summary:
    - Total Income: ₹${totalIncome.toFixed(2)}
    - Total Expenses: ₹${totalExpenses.toFixed(2)}
    - Net Income: ₹${(totalIncome - totalExpenses).toFixed(2)}
    
    Spending by Category:
    ${Object.entries(categorySpending)
      .map(([category, amount]) => `- ${category}: ₹${(amount as number).toFixed(2)}`)
      .join('\n')}
    
    Active Budgets:
    ${budgets.length > 0 
      ? budgets.map((b) => `- ${b.categories?.name || 'Uncategorized'}: ₹${b.amount} (${b.period})`)
        .join('\n')
      : 'No budgets set yet'
    }
    
    Please provide a JSON response with exactly these keys:
    {
      "summary": "2-3 sentence financial overview focusing on their spending vs income",
      "topCategories": ["analysis of top 3 spending categories with amounts and percentages"],
      "savingTips": ["3 specific money-saving tips based on their spending patterns"],
      "budgetRecommendations": ["3 actionable budget recommendations"]
    }
    
    Make it personal, specific to their data, and encouraging. Use Indian Rupee (₹) format.
  `

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON, fallback to structured insights if parsing fails
    try {
      const parsed = JSON.parse(text)
      
      // Validate the response has required fields
      if (parsed.summary && parsed.topCategories && parsed.savingTips && parsed.budgetRecommendations) {
        return parsed
      } else {
        return generateFallbackInsights()
      }
    } catch (parseError) {
      return generateFallbackInsights()
    }
  } catch (error) {
    // Gemini API error
    return generateFallbackInsights()
  }
}

/**
 * Calls the Gemini 1.5 Flash REST API directly with a prompt.
 * @param prompt The prompt string to send to Gemini.
 * @param apiKey Your Gemini API key.
 * @returns The generated content as a string.
 */
export async function generateContentWithGeminiFlash(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // The response structure: { candidates: [ { content: { parts: [ { text: ... }] } } ] }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No content returned from Gemini API");
  return text;
}
