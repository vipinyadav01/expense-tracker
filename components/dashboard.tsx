"use client"

import { useEffect, useState } from "react"
import { supabase, type Transaction, type Budget } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { IndianRupee, TrendingUp, TrendingDown, PieChart, Brain } from "lucide-react"
import { generateFinancialInsights } from "@/lib/gemini"
import ExpenseChart from "@/components/expense-chart"
import TransactionList from "@/components/transaction-list"
import AddTransactionDialog from "@/components/add-transaction-dialog"
import BudgetOverview from "@/components/budget-overview"
import AIInsights from "@/components/ai-insights"
import Navbar from "@/components/navbar"
import { useUserInit } from "@/hooks/use-user-init"

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  
  // Initialize user in Supabase
  const { isInitialized, isInitializing, error: userInitError } = useUserInit()

  useEffect(() => {
    // Only fetch data after user is initialized
    if (isInitialized && !isInitializing) {
      fetchData()
    }
  }, [userId, isInitialized, isInitializing])

  const fetchData = async () => {
    try {
      // Fetch transactions
      const { data: transactionsData } = await supabase
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

      // Fetch budgets
      const { data: budgetsData } = await supabase
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

      setTransactions(transactionsData || [])
      setBudgets(budgetsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    if (transactions.length === 0) {
      console.log('⚠️ No transactions available for insights generation')
      return
    }

    setInsightsLoading(true)
    try {
      console.log('🚀 Starting insights generation with:', {
        transactionCount: transactions.length,
        budgetCount: budgets.length,
        sampleTransaction: transactions[0]
      })
      
      const aiInsights = await generateFinancialInsights(transactions, budgets)
      console.log('✅ Received insights:', aiInsights)
      setInsights(aiInsights)
    } catch (error) {
      console.error("❌ Error generating insights:", error)
      // Set a user-friendly error message
      setInsights({
        summary: "Unable to generate insights at this time. Please try again later.",
        topCategories: ["Please add more transactions to get better insights"],
        savingTips: ["Track your daily expenses", "Set a monthly budget", "Review your spending regularly"],
        budgetRecommendations: ["Start with a simple 50/30/20 budget", "Track your biggest expense categories", "Set realistic savings goals"]
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyTransactions = transactions.filter((t) => t.transaction_date.startsWith(currentMonth))

  // Calculate monthly totals
  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

  // Calculate all-time totals for expenses
  const allTimeExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

  // Calculate total budget amount
  const totalBudget = budgets.reduce((sum, budget) => {
    // Convert yearly budgets to monthly for comparison
    const monthlyBudgetAmount = budget.period === 'yearly' ? budget.amount / 12 : budget.amount
    return sum + monthlyBudgetAmount
  }, 0)

  const netIncome = totalIncome - totalExpenses

  // Show error if user initialization failed
  if (userInitError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-4 pt-20 sm:p-6 sm:pt-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Initialization Error</CardTitle>
              <CardDescription>
                Failed to initialize user account. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{userInitError}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading || isInitializing || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-4 pt-20 sm:p-6 sm:pt-24 space-y-4 sm:space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 pt-20 sm:pt-24 space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Track your expenses and manage your budget efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Monthly Income */}
          <Card className="group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Monthly Income
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 group-hover:text-green-500 transition-colors">
                ₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
              <div className="w-full bg-green-100 dark:bg-green-900/20 rounded-full h-1 mt-2 sm:mt-3">
                <div className="bg-green-500 h-1 rounded-full w-3/4 transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="group hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-red-500 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Monthly Expenses
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600 group-hover:text-red-500 transition-colors">
                ₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
              <div className="w-full bg-red-100 dark:bg-red-900/20 rounded-full h-1 mt-2 sm:mt-3">
                <div className="bg-red-500 h-1 rounded-full w-2/3 transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses (All Time) */}
          <Card className="group hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Total Expenses
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-600 group-hover:text-orange-500 transition-colors">
                ₹{allTimeExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
              <div className="w-full bg-orange-100 dark:bg-orange-900/20 rounded-full h-1 mt-2 sm:mt-3">
                <div className="bg-orange-500 h-1 rounded-full w-5/6 transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          {/* Total Budget */}
          <Card className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Total Budget
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-600 group-hover:text-purple-500 transition-colors">
                ₹{totalBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monthly limit</p>
              <div className="w-full bg-purple-100 dark:bg-purple-900/20 rounded-full h-1 mt-2 sm:mt-3">
                <div className="bg-purple-500 h-1 rounded-full w-4/5 transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 bg-gradient-to-br from-card to-card/50 ${
            netIncome >= 0 
              ? "border-l-green-500 hover:shadow-green-500/10" 
              : "border-l-red-500 hover:shadow-red-500/10"
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Net Income
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                netIncome >= 0 
                  ? "bg-green-500/10 group-hover:bg-green-500/20" 
                  : "bg-red-500/10 group-hover:bg-red-500/20"
              }`}>
                <IndianRupee className={`h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform ${
                  netIncome >= 0 ? "text-green-600" : "text-red-600"
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl lg:text-3xl font-bold transition-colors ${
                netIncome >= 0 
                  ? "text-green-600 group-hover:text-green-500" 
                  : "text-red-600 group-hover:text-red-500"
              }`}>
                ₹{Math.abs(netIncome).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {netIncome >= 0 ? "Saved this month" : "Over budget"}
              </p>
              <div className={`w-full rounded-full h-1 mt-2 sm:mt-3 ${
                netIncome >= 0 
                  ? "bg-green-100 dark:bg-green-900/20" 
                  : "bg-red-100 dark:bg-red-900/20"
              }`}>
                <div className={`h-1 rounded-full transition-all duration-500 ${
                  netIncome >= 0 
                    ? "bg-green-500 w-4/5" 
                    : "bg-red-500 w-1/2"
                }`}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <AddTransactionDialog onTransactionAdded={fetchData}>
            <Button size="lg" className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base">
              <span className="mr-2 group-hover:scale-110 transition-transform">💰</span>
              Add Transaction
            </Button>
          </AddTransactionDialog>
          
          <Button 
            size="lg" 
            variant="outline" 
            onClick={generateInsights}
            disabled={insightsLoading}
            className="group border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
          >
            <Brain className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            {insightsLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2"></div>
                Analyzing...
              </span>
            ) : (
              "Generate AI Insights"
            )}
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-10 sm:h-12 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline-block">📊 Overview</span>
              <span className="sm:hidden inline-block">📊</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline-block">💳 Transactions</span>
              <span className="sm:hidden inline-block">💳</span>
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline-block">🎯 Budgets</span>
              <span className="sm:hidden inline-block">🎯</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline-block">🧠 AI Insights</span>
              <span className="sm:hidden inline-block">🧠</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-1">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50 flex flex-col h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center text-base sm:text-lg lg:text-xl">
                      📈
                    </div>
                    <span className="truncate">Expense Breakdown</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Visual representation of your spending</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 flex-1 flex items-center">
                  <div className="w-full">
                    <ExpenseChart transactions={transactions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50 flex flex-col h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center text-base sm:text-lg lg:text-xl">
                      🎯
                    </div>
                    <span className="truncate">Budget Overview</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Track your budget progress</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 flex-1 flex items-center">
                  <div className="w-full">
                    <BudgetOverview budgets={budgets} transactions={transactions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                    💳
                  </div>
                  Recent Transactions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your latest financial activities</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <TransactionList transactions={transactions} onUpdate={fetchData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                    🎯
                  </div>
                  Budget Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Monitor and manage your spending limits</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <BudgetOverview budgets={budgets} transactions={transactions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                        🧠
                      </div>
                      AI Financial Insights
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Get personalized financial advice powered by AI</CardDescription>
                  </div>
                  <Button 
                    onClick={generateInsights}
                    disabled={insightsLoading}
                    className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Brain className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    {insightsLoading ? "Analyzing..." : "Generate Insights"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <AIInsights insights={insights} loading={insightsLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
