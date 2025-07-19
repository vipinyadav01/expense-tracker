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

  if (transactions.length === 0) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Monthly Spending Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px] sm:h-[250px]">
            <p className="text-sm text-muted-foreground">No expense data available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Spending by Category</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Breakdown of your expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px] sm:h-[250px]">
            <p className="text-sm text-muted-foreground">No expense data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Monthly Spending Trend</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData.monthlyChartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{Number(payload[0].value).toLocaleString('en-IN')}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Spending by Category</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Breakdown of your expenses by category</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
            {/* Mobile: Show as List */}
            <div className="block sm:hidden">
              <div className="space-y-2">
                {chartData.categoryChartData.slice(0, 5).map((entry, index) => {
                  const total = chartData.categoryChartData.reduce((sum, item) => sum + item.amount, 0)
                  const percentage = ((entry.amount / total) * 100).toFixed(1)
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium truncate">{entry.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">₹{entry.amount.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Show as Pie Chart */}
            <div className="hidden sm:block h-full">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      dataKey="amount"
                      label={({ category, percent }) => 
                        percent > 0.05 ? `${category.length > 8 ? category.slice(0, 8) + '...' : category}` : ''
                      }
                      labelLine={false}
                      fontSize={11}
                    >
                      {chartData.categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const total = chartData.categoryChartData.reduce((sum, item) => sum + item.amount, 0)
                          const percentage = ((data.amount / total) * 100).toFixed(1)
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-md">
                              <p className="font-medium text-sm">{data.category}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{data.amount.toLocaleString('en-IN')} ({percentage}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
