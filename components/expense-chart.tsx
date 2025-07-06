"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts"
import type { Transaction } from "@/lib/supabase"

interface ExpenseChartProps {
  transactions: Transaction[]
}

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    // Monthly spending data
    const monthlyData = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, transaction) => {
          const month = transaction.transaction_date.slice(0, 7)
          acc[month] = (acc[month] || 0) + Number.parseFloat(transaction.amount.toString())
          return acc
        },
        {} as Record<string, number>,
      )

    const monthlyChartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        amount: amount,
      }))

    // Category spending data
    const categoryData = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, transaction) => {
          const category = transaction.categories?.name || "Other"
          const color = transaction.categories?.color || "#6B7280"
          acc[category] = {
            amount: (acc[category]?.amount || 0) + Number.parseFloat(transaction.amount.toString()),
            color: color,
          }
          return acc
        },
        {} as Record<string, { amount: number; color: string }>,
      )

    const categoryChartData = Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        color: data.color,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    return { monthlyChartData, categoryChartData }
  }, [transactions])

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <CardDescription>Your spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyChartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Breakdown of your expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.categoryChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{data.category}</p>
                          <p className="text-sm text-muted-foreground">₹{data.amount.toFixed(2)}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
