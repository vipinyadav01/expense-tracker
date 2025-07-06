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
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No budgets set up yet</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {budgetData.map((budget) => (
        <Card key={budget.id} className={budget.isOverBudget ? "border-red-200" : ""}>
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
              <Badge variant={budget.isOverBudget ? "destructive" : "secondary"}>{budget.period}</Badge>
            </div>
            {detailed && (
              <CardDescription>
                Budget: ₹{budget.amount.toFixed(2)} | Spent: ₹{budget.spent.toFixed(2)} | Remaining: ₹
                {budget.remaining.toFixed(2)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>₹{budget.spent.toFixed(2)} spent</span>
                <span>₹{budget.amount.toFixed(2)} budget</span>
              </div>
              <Progress value={Math.min(budget.percentage, 100)} className={budget.isOverBudget ? "bg-red-100" : ""} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{budget.percentage.toFixed(1)}% used</span>
                <span className={budget.remaining < 0 ? "text-red-600 font-medium" : "text-green-600"}>
                  {budget.remaining < 0 ? "Over by " : "Remaining: "}₹{Math.abs(budget.remaining).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
