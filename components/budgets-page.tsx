"use client"

import { useEffect, useState } from "react"
import { supabase, type Transaction, type Budget, type Category } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, AlertTriangle, TrendingUp, Calendar, IndianRupee, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import Navbar from "@/components/navbar"
import AddBudgetDialog from "@/components/add-budget-dialog"
import EditBudgetDialog from "@/components/edit-budget-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BudgetsPageProps {
  userId: string
}

export default function BudgetsPage({ userId }: BudgetsPageProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [budgetsResponse, transactionsResponse, categoriesResponse] = await Promise.all([
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
          .order("created_at", { ascending: false }),
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
          .eq("type", "expense"),
        supabase.from("categories").select("*").order("name"),
      ])

      setBudgets(budgetsResponse.data || [])
      setTransactions(transactionsResponse.data || [])
      setCategories(categoriesResponse.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId)

      if (error) throw error

      toast.success("Budget deleted successfully!")
      fetchData()
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast.error("Failed to delete budget")
    }
  }

  const calculateBudgetData = (budget: Budget) => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const currentYear = now.getFullYear().toString()

    let relevantTransactions = transactions.filter((t) => t.category_id === budget.category_id)

    if (budget.period === "monthly") {
      relevantTransactions = relevantTransactions.filter((t) => t.transaction_date.startsWith(currentMonth))
    } else {
      relevantTransactions = relevantTransactions.filter((t) => t.transaction_date.startsWith(currentYear))
    }

    const spent = relevantTransactions.reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    const remaining = budget.amount - spent
    const isOverBudget = spent > budget.amount

    return {
      spent,
      percentage,
      remaining,
      isOverBudget,
      transactionCount: relevantTransactions.length,
    }
  }

  const budgetStats = budgets.map((budget) => ({
    ...budget,
    ...calculateBudgetData(budget),
  }))

  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgetStats.reduce((sum, b) => sum + b.spent, 0)
  const overBudgetCount = budgetStats.filter((b) => b.isOverBudget).length
  const onTrackCount = budgetStats.filter((b) => !b.isOverBudget && b.percentage > 50).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <AddBudgetDialog onSuccess={fetchData} userId={userId} categories={categories} />
        </div>

        {/* Budget Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalBudgetAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Across {budgets.length} budgets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {totalBudgetAmount > 0 ? ((totalSpent / totalBudgetAmount) * 100).toFixed(1) : 0}% of total budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overBudgetCount}</div>
              <p className="text-xs text-muted-foreground">Categories exceeded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Track</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onTrackCount}</div>
              <p className="text-xs text-muted-foreground">Categories progressing well</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Budgets</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Budgets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {budgetStats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budgets created yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Start managing your finances by creating your first budget
                  </p>
                  <AddBudgetDialog onSuccess={fetchData} userId={userId} categories={categories} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgetStats.map((budget) => (
                  <Card key={budget.id} className={budget.isOverBudget ? "border-red-200 dark:border-red-800" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.categories?.color || "#6B7280" }}
                          />
                          <CardTitle className="text-base">{budget.categories?.name}</CardTitle>
                          {budget.isOverBudget && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={budget.isOverBudget ? "destructive" : "secondary"}>{budget.period}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingBudget(budget)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteBudget(budget.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardDescription>
                        Budget: ₹{budget.amount.toFixed(2)} | Spent: ₹{budget.spent.toFixed(2)} |
                        {budget.remaining >= 0 ? " Remaining: " : " Over by: "}₹{Math.abs(budget.remaining).toFixed(2)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress
                          value={Math.min(budget.percentage, 100)}
                          className={budget.isOverBudget ? "bg-red-100 dark:bg-red-950" : ""}
                        />
                        <div className="flex justify-between text-sm">
                          <span className={budget.percentage > 100 ? "text-red-600 font-medium" : ""}>
                            {budget.percentage.toFixed(1)}% used
                          </span>
                          <span className="text-muted-foreground">{budget.transactionCount} transactions</span>
                        </div>
                        {budget.isOverBudget && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Budget exceeded by ₹{(budget.spent - budget.amount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {budgetStats
                .filter((b) => b.period === "monthly")
                .map((budget) => (
                  <Card key={budget.id} className={budget.isOverBudget ? "border-red-200 dark:border-red-800" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.categories?.color || "#6B7280" }}
                          />
                          <CardTitle className="text-base">{budget.categories?.name}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Monthly
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">This Month</span>
                          <span className="font-medium">
                            ₹{budget.spent.toFixed(2)} / ₹{budget.amount.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={Math.min(budget.percentage, 100)} />
                        <div className="text-xs text-muted-foreground">
                          {budget.remaining >= 0
                            ? `₹${budget.remaining.toFixed(2)} remaining`
                            : `₹${Math.abs(budget.remaining).toFixed(2)} over budget`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {budgetStats.filter((b) => b.period === "monthly").length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No monthly budgets created yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {budgetStats
                .filter((b) => b.period === "yearly")
                .map((budget) => (
                  <Card key={budget.id} className={budget.isOverBudget ? "border-red-200 dark:border-red-800" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.categories?.color || "#6B7280" }}
                          />
                          <CardTitle className="text-base">{budget.categories?.name}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Yearly
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">This Year</span>
                          <span className="font-medium">
                            ₹{budget.spent.toFixed(2)} / ₹{budget.amount.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={Math.min(budget.percentage, 100)} />
                        <div className="text-xs text-muted-foreground">
                          {budget.remaining >= 0
                            ? `₹${budget.remaining.toFixed(2)} remaining`
                            : `₹${Math.abs(budget.remaining).toFixed(2)} over budget`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {budgetStats.filter((b) => b.period === "yearly").length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No yearly budgets created yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {editingBudget && (
          <EditBudgetDialog
            budget={editingBudget}
            open={!!editingBudget}
            onOpenChange={(open) => !open && setEditingBudget(null)}
            onSuccess={() => {
              setEditingBudget(null)
              fetchData()
            }}
            categories={categories}
          />
        )}
      </div>
    </div>
  )
}
