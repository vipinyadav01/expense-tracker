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

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [userId])

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
    setInsightsLoading(true)
    try {
      const aiInsights = await generateFinancialInsights(transactions, budgets)
      setInsights(aiInsights)
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyTransactions = transactions.filter((t) => t.transaction_date.startsWith(currentMonth))

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

  const netIncome = totalIncome - totalExpenses

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{netIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyTransactions.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle>AI Financial Insights</CardTitle>
              </div>
              <Button onClick={generateInsights} disabled={insightsLoading} size="sm">
                {insightsLoading ? "Generating..." : "Generate Insights"}
              </Button>
            </div>
            <CardDescription>Get personalized financial advice powered by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <AIInsights insights={insights} loading={insightsLoading} />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionList transactions={transactions.slice(0, 5)} onUpdate={fetchData} userId={userId} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                  <CardDescription>Track your spending against budgets</CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetOverview budgets={budgets} transactions={monthlyTransactions} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Transactions</h2>
              <AddTransactionDialog onSuccess={fetchData} userId={userId} />
            </div>
            <Card>
              <CardContent className="p-6">
                <TransactionList transactions={transactions} onUpdate={fetchData} userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Budget Management</h2>
            </div>
            <BudgetOverview budgets={budgets} transactions={monthlyTransactions} detailed={true} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-2xl font-bold">Financial Analytics</h2>
            <ExpenseChart transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
