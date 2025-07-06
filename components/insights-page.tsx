"use client"

import { useEffect, useState } from "react"
import { supabase, type Transaction, type Budget } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, TrendingDown, IndianRupee, Target, AlertTriangle, Lightbulb, BarChart3, PieChart, Calendar, Wallet } from 'lucide-react'
import { generateFinancialInsights } from "@/lib/gemini"
import Navbar from "@/components/navbar"
import ExpenseChart from "@/components/expense-chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"

interface InsightsPageProps {
  userId: string
}

export default function InsightsPage({ userId }: InsightsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>({})

  useEffect(() => {
    fetchData()
  }, [userId])

  useEffect(() => {
    if (transactions.length > 0) {
      calculateAnalytics()
    }
  }, [transactions])

  const fetchData = async () => {
    try {
      const [transactionsResponse, budgetsResponse] = await Promise.all([
        supabase
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
          .order("transaction_date", { ascending: false }),
        supabase
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
      ])

      setTransactions(transactionsResponse.data || [])
      setBudgets(budgetsResponse.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = () => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const currentYear = now.getFullYear().toString()

    // Monthly comparison
    const currentMonthTransactions = transactions.filter(t => t.transaction_date.startsWith(currentMonth))
    const lastMonthTransactions = transactions.filter(t => t.transaction_date.startsWith(lastMonth))

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

    const monthlyChange = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0

    // Category analysis
    const categorySpending = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.categories?.name || "Other"
        acc[category] = (acc[category] || 0) + Number.parseFloat(t.amount.toString())
        return acc
      }, {} as Record<string, number>)

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    // Weekly spending trend
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayExpenses = transactions
        .filter(t => t.transaction_date === dateStr && t.type === "expense")
        .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayExpenses
      })
    }

    // Monthly trend for the year
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().slice(0, 7)
      
      const monthExpenses = transactions
        .filter(t => t.transaction_date.startsWith(monthStr) && t.type === "expense")
        .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthExpenses
      })
    }

    setAnalytics({
      monthlyChange,
      topCategories,
      weeklyData,
      monthlyTrend,
      currentMonthExpenses,
      lastMonthExpenses
    })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Financial Insights</h1>
          <Button onClick={generateInsights} disabled={insightsLoading}>
            <Brain className="h-4 w-4 mr-2" />
            {insightsLoading ? "Generating..." : "Generate AI Insights"}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.currentMonthExpenses?.toFixed(2) || "0.00"}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analytics.monthlyChange > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={analytics.monthlyChange > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(analytics.monthlyChange).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.topCategories?.[0]?.category || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{analytics.topCategories?.[0]?.amount?.toFixed(2) || "0.00"} spent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.length}</div>
              <p className="text-xs text-muted-foreground">
                {budgets.filter(b => {
                  const spent = transactions
                    .filter(t => t.category_id === b.category_id && t.type === "expense")
                    .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)
                  return spent > b.amount
                }).length} over budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">Total recorded</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Spending</CardTitle>
                  <CardDescription>Your daily expenses this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--chart-1))" } }} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.weeklyData}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                  <CardDescription>Your highest expense categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topCategories?.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{item.category}</span>
                        </div>
                        <span className="font-bold">₹{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
                <CardDescription>Your spending pattern over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--chart-2))" } }} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyTrend}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-2))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <ExpenseChart transactions={transactions} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <CardTitle>AI-Powered Financial Analysis</CardTitle>
                  </div>
                  <Button onClick={generateInsights} disabled={insightsLoading} size="sm">
                    {insightsLoading ? "Analyzing..." : "Refresh Analysis"}
                  </Button>
                </div>
                <CardDescription>
                  Get personalized insights and recommendations based on your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : insights ? (
                  <div className="space-y-6">
                    {/* Financial Summary */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Financial Summary
                      </h4>
                      <Card className="p-4 bg-blue-50 dark:bg-blue-950">
                        <p className="text-sm">{insights.summary}</p>
                      </Card>
                    </div>

                    {/* Top Categories Analysis */}
                    {insights.topCategories && insights.topCategories.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Spending Analysis
                        </h4>
                        <div className="grid gap-3">
                          {insights.topCategories.map((item: string, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="text-xs mt-0.5">
                                  {index + 1}
                                </Badge>
                                <p className="text-sm flex-1">{item}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Saving Tips */}
                    {insights.savingTips && insights.savingTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Personalized Saving Tips
                        </h4>
                        <div className="grid gap-3">
                          {insights.savingTips.map((tip: string, index: number) => (
                            <Card key={index} className="p-4 bg-green-50 dark:bg-green-950">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs">💡</span>
                                </div>
                                <p className="text-sm">{tip}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Budget Recommendations */}
                    {insights.budgetRecommendations && insights.budgetRecommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Budget Recommendations
                        </h4>
                        <div className="grid gap-3">
                          {insights.budgetRecommendations.map((rec: string, index: number) => (
                            <Card key={index} className="p-4 bg-purple-50 dark:bg-purple-950">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Target className="h-3 w-3" />
                                </div>
                                <p className="text-sm">{rec}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No insights generated yet</p>
                    <p className="text-sm">Click "Generate AI Insights" to get personalized financial analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
