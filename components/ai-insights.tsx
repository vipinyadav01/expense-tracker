"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, Lightbulb, Target } from "lucide-react"

interface AIInsightsProps {
  insights: any
  loading: boolean
}

export default function AIInsights({ insights, loading }: AIInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Click "Generate Insights" to get AI-powered financial analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Financial Summary
        </h4>
        <p className="text-sm text-muted-foreground">{insights.summary}</p>
      </div>

      {/* Top Categories */}
      {insights.topCategories && insights.topCategories.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Badge variant="outline" className="h-4 w-4 p-0">
              <span className="text-xs">📊</span>
            </Badge>
            Top Spending Analysis
          </h4>
          <div className="space-y-2">
            {insights.topCategories.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saving Tips */}
      {insights.savingTips && insights.savingTips.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Money-Saving Tips
          </h4>
          <div className="space-y-2">
            {insights.savingTips.map((tip: string, index: number) => (
              <Card key={index} className="p-3">
                <p className="text-sm">{tip}</p>
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
          <div className="space-y-2">
            {insights.budgetRecommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs">
                  💡
                </Badge>
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
