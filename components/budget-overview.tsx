"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle } from "lucide-react"
import type { Budget, Transaction } from "@/lib/supabase"

interface BudgetOverviewProps {
  budgets: Budget[]
  transactions: Transaction[]
  detailed?: boolean
}

export default function BudgetOverview({ budgets, transactions, detailed = false }: BudgetOverviewProps) {
  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const categoryTransactions = transactions.filter(
        (t) => t.category_id === budget.category_id && t.type === "expense",
      )

      const spent = categoryTransactions.reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const remaining = budget.amount - spent

      return {
        ...budget,
        spent,
        percentage,
        remaining,
        isOverBudget: spent > budget.amount,
      }
    })
  }, [budgets, transactions])

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-2">No budgets yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create your first budget to start tracking your spending limits
        </p>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {budgetData.map((budget) => (
        <Card 
          key={budget.id} 
          className={`transition-all duration-200 hover:shadow-md ${
            budget.isOverBudget 
              ? "border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-800" 
              : "hover:border-primary/20"
          }`}
        >
          <CardHeader className="pb-3 sm:pb-4">
            {/* Header: Category info and badge */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: budget.categories?.color || "#6B7280" }}
                />
                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {budget.categories?.name}
                </CardTitle>
                {budget.isOverBudget && (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              <Badge 
                variant={budget.isOverBudget ? "destructive" : "secondary"}
                className="text-xs self-start sm:self-center"
              >
                {budget.period}
              </Badge>
            </div>

            {/* Detailed description for larger screens */}
            {detailed && (
              <CardDescription className="text-xs sm:text-sm pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <span>Budget: ₹{budget.amount.toLocaleString('en-IN')}</span>
                  <span>Spent: ₹{budget.spent.toLocaleString('en-IN')}</span>
                  <span className={budget.remaining < 0 ? "text-red-600" : "text-green-600"}>
                    {budget.remaining < 0 ? "Over: " : "Left: "}
                    ₹{Math.abs(budget.remaining).toLocaleString('en-IN')}
                  </span>
                </div>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Amount display */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">
                    ₹{budget.spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-muted-foreground">spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">of</span>
                  <span className="text-xs sm:text-sm font-medium">
                    ₹{budget.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className={`h-2 sm:h-3 ${
                    budget.isOverBudget 
                      ? "bg-red-100 dark:bg-red-950/20" 
                      : "bg-muted"
                  }`}
                />
                
                {/* Progress details */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {budget.percentage.toFixed(1)}% used
                  </span>
                  <div className="text-right">
                    <span 
                      className={`text-xs font-medium ${
                        budget.remaining < 0 
                          ? "text-red-600" 
                          : "text-green-600"
                      }`}
                    >
                      {budget.remaining < 0 ? "Over by " : "Remaining: "}
                      ₹{Math.abs(budget.remaining).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile-only summary for non-detailed view */}
              {!detailed && (
                <div className="block sm:hidden pt-2 border-t border-muted/50">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Budget limit</span>
                    <span>₹{budget.amount.toLocaleString('en-IN')} / {budget.period}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
