"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase, type Transaction, type Budget } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, TrendingDown, IndianRupee, Target, Lightbulb, BarChart3, PieChart } from 'lucide-react'
import { generateContentWithGeminiFlash, type FinancialInsights } from "@/lib/gemini"
import Navbar from "@/components/navbar"
import ExpenseChart from "@/components/expense-chart"
import { useUserInit } from "@/hooks/use-user-init"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"

interface InsightsPageProps {
  userId: string
}

interface AnalyticsData {
  monthlyChange: number;
  topCategories: { category: string; amount: number }[];
  weeklyData: { day: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  currentMonthExpenses: number;
  lastMonthExpenses: number;
  overBudgetCount: number;
}

// --- Main Component ---
export default function InsightsPage({ userId }: InsightsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [insights, setInsights] = useState<FinancialInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Initialize user in Supabase
  const { isInitialized, isInitializing, error: userInitError } = useUserInit()

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [transactionsResponse, budgetsResponse] = await Promise.all([
          supabase
            .from("transactions")
            .select(`*, categories (id, name, color, icon)`)
            .eq("user_id", userId)
            .order("transaction_date", { ascending: false }),
          supabase
            .from("budgets")
            .select(`*, categories (id, name, color, icon)`)
            .eq("user_id", userId),
        ]);

        if (transactionsResponse.error) throw transactionsResponse.error;
        if (budgetsResponse.error) throw budgetsResponse.error;

        setTransactions(transactionsResponse.data || []);
        setBudgets(budgetsResponse.data || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

         if (userId && isInitialized && !isInitializing) {
       fetchData();
     }
   }, [userId, isInitialized, isInitializing]);

  // --- Analytics Calculation (Memoized for Performance) ---
  const analytics: AnalyticsData | null = useMemo(() => {
    if (transactions.length === 0) return null;

    const now = new Date();
    
    // Group expenses by date and month for efficient processing
    const expensesByDate = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();
    
    for (const t of transactions) {
        if (t.type === 'expense') {
            const amount = Number.parseFloat(t.amount.toString());
            const dateStr = t.transaction_date; // YYYY-MM-DD
            const monthStr = dateStr.slice(0, 7); // YYYY-MM

            expensesByDate.set(dateStr, (expensesByDate.get(dateStr) || 0) + amount);
            expensesByMonth.set(monthStr, (expensesByMonth.get(monthStr) || 0) + amount);
        }
    }

    // 1. Monthly comparison
    const currentMonthKey = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);
    
    const currentMonthExpenses = expensesByMonth.get(currentMonthKey) || 0;
    const lastMonthExpenses = expensesByMonth.get(lastMonthKey) || 0;
    const monthlyChange = lastMonthExpenses > 0
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : currentMonthExpenses > 0 ? 100 : 0;

    // 2. Category analysis
    const categorySpending = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.categories?.name || "Uncategorized";
        acc[category] = (acc[category] || 0) + Number.parseFloat(t.amount.toString());
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // 3. Weekly spending trend (last 7 days)
    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            amount: expensesByDate.get(dateKey) || 0
        };
    }).reverse();

    // 4. Monthly trend for the year (last 12 months)
    const monthlyTrend = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            amount: expensesByMonth.get(monthKey) || 0
        };
    }).reverse();
    
    // 5. Budget Overrun Calculation (Corrected Logic)
    let overBudgetCount = 0;
    const currentMonthTransactions = transactions.filter(t => t.transaction_date.startsWith(currentMonthKey));

    for (const budget of budgets) {
        // Only check monthly budgets for now
        if (budget.period.toLowerCase() === 'monthly') {
            const spentThisMonth = currentMonthTransactions
                .filter(t => t.type === 'expense' && t.categories?.id === budget.categories?.id)
                .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0);

            if (spentThisMonth > budget.amount) {
                overBudgetCount++;
            }
        }
    }

    return {
      monthlyChange,
      topCategories,
      weeklyData,
      monthlyTrend,
      currentMonthExpenses,
      lastMonthExpenses,
      overBudgetCount
    };
  }, [transactions, budgets]);

  // --- AI Insights Generation ---
  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.summary) {
        setInsights(data);
      } else if (data.error) {
        console.error("AI Insights error:", data.error);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Automatically generate insights on first load
  useEffect(() => {
    if (!loading && transactions.length > 0 && !insights) {
      generateInsights();
    }
  }, [loading, transactions, insights]);


     // --- Render Logic ---
   // Show error if user initialization failed
   if (userInitError) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="container mx-auto p-4 pt-24">
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
        <div className="container mx-auto p-4 pt-24 space-y-4 sm:p-6 sm:pt-28">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"> <Skeleton className="h-4 w-20" /> </CardHeader>
                <CardContent> <Skeleton className="h-8 w-24" /> </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
     return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto p-4 pt-24 text-center">
                <h1 className="text-2xl font-bold mb-2">No Data Yet</h1>
                <p className="text-muted-foreground">Start by adding some transactions to see your financial insights.</p>
            </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-24 space-y-4 sm:p-6 sm:pt-28 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Financial Insights</h1>

        {/* Key Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Spending</CardTitle>
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">₹{analytics.currentMonthExpenses.toFixed(2)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analytics.monthlyChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={analytics.monthlyChange >= 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(analytics.monthlyChange).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Top Category</CardTitle>
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold truncate">
                {analytics.topCategories?.[0]?.category || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{analytics.topCategories?.[0]?.amount?.toFixed(2) || "0.00"} spent
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Budgets</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{budgets.length}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overBudgetCount} over budget this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Transactions</CardTitle>
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">Total recorded</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="ai-insights" className="text-xs sm:text-sm px-2 py-2">AI Insights</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm px-2 py-2">Trends</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 py-2">Categories</TabsTrigger>
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">Overview</TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base sm:text-lg">AI-Powered Financial Analysis</CardTitle>
                  </div>
                  <Button onClick={generateInsights} disabled={insightsLoading} size="sm" className="w-full sm:w-auto">
                    {insightsLoading ? "Analyzing..." : "Refresh Analysis"}
                  </Button>
                </div>
                <CardDescription className="text-xs sm:text-sm pt-2">
                  Get personalized insights and recommendations based on your spending patterns.
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
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base"><TrendingUp className="h-4 w-4" />Financial Summary</h4>
                      <Card className="p-4 bg-blue-50 dark:bg-blue-950/50"><p className="text-sm">{insights.summary}</p></Card>
                    </div>
                    {insights.topCategories?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base"><BarChart3 className="h-4 w-4" />Spending Analysis</h4>
                        <div className="grid gap-3">{insights.topCategories.map((item, index) => (
                          <Card key={index} className="p-3"><div className="flex items-start gap-2">
                            <Badge variant="secondary" className="text-xs mt-0.5">{index + 1}</Badge>
                            <p className="text-sm flex-1">{item}</p>
                          </div></Card>
                        ))}</div>
                      </div>
                    )}
                    {insights.savingTips?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base"><Lightbulb className="h-4 w-4" />Personalized Saving Tips</h4>
                        <div className="grid gap-3">{insights.savingTips.map((tip, index) => (
                          <Card key={index} className="p-4 bg-green-50 dark:bg-green-950/50"><div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">💡</div>
                            <p className="text-sm">{tip}</p>
                          </div></Card>
                        ))}</div>
                      </div>
                    )}
                    {insights.budgetRecommendations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base"><Target className="h-4 w-4" />Budget Recommendations</h4>
                        <div className="grid gap-3">{insights.budgetRecommendations.map((rec, index) => (
                          <Card key={index} className="p-4 bg-purple-50 dark:bg-purple-950/50"><div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5"><Target className="h-3 w-3" /></div>
                            <p className="text-sm">{rec}</p>
                          </div></Card>
                        ))}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2 text-base">No insights generated yet</p>
                    <p className="text-sm">Click "Refresh Analysis" to get personalized financial analysis.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Monthly Spending Trend</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your spending pattern over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="categories" className="space-y-4">
            <ExpenseChart transactions={transactions} />
          </TabsContent>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Weekly Spending</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your daily expenses this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Top 5 Spending Categories</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your highest expense categories of all time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topCategories.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                          <span className="font-medium text-sm truncate">{item.category}</span>
                        </div>
                        <span className="font-bold text-sm flex-shrink-0">₹{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
