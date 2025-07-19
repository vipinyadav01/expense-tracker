"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, Lightbulb, Target, AlertTriangle } from "lucide-react"

interface AIInsightsProps {
  insights: any
  loading: boolean
}

export default function AIInsights({ insights, loading }: AIInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm sm:text-base text-muted-foreground">
            Analyzing your financial data...
          </span>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-2">No insights generated yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Click "Generate Insights" to get AI-powered financial analysis
        </p>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6 p-3 bg-muted/50 text-xs max-w-md">
            <p className="font-medium mb-2">🔧 Debug Info:</p>
            <div className="space-y-1 text-left">
              <p>API Key configured: {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Yes' : 'No'}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // Check if this looks like fallback data
  const isFallbackData = insights.summary?.includes("No expenses recorded yet") || 
                         insights.summary?.includes("Unable to generate insights")

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Show warning if using fallback data */}
      {isFallbackData && (
        <Card className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Using Basic Analysis
              </p>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                AI insights are currently unavailable. Showing analysis based on your transaction data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Financial Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h4 className="text-sm sm:text-base font-semibold">Financial Summary</h4>
        </div>
        <Card className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm sm:text-base leading-relaxed">{insights.summary}</p>
        </Card>
      </div>

      {/* Top Categories Analysis */}
      {insights.topCategories?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-primary/10">
              <span className="text-xs">📊</span>
            </div>
            <h4 className="text-sm sm:text-base font-semibold">Spending Analysis</h4>
          </div>
          <div className="grid gap-2 sm:gap-3">
            {insights.topCategories.map((item: string, index: number) => (
              <Card key={index} className="p-3 sm:p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <Badge 
                    variant="secondary" 
                    className="text-xs mt-0.5 flex-shrink-0 min-w-[24px] h-6 flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <p className="text-sm sm:text-base flex-1 leading-relaxed">{item}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grid Layout for Tips and Recommendations */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Saving Tips */}
        {insights.savingTips?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h4 className="text-sm sm:text-base font-semibold">Money-Saving Tips</h4>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {insights.savingTips.map((tip: string, index: number) => (
                <Card 
                  key={index} 
                  className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">💡</span>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed">{tip}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Budget Recommendations */}
        {insights.budgetRecommendations?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h4 className="text-sm sm:text-base font-semibold">Budget Recommendations</h4>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {insights.budgetRecommendations.map((rec: string, index: number) => (
                <Card 
                  key={index} 
                  className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed">{rec}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-3 bg-muted/50 text-xs border-dashed">
          <div className="space-y-2">
            <p className="font-medium">🔧 Debug Information:</p>
            <div className="grid grid-cols-2 gap-4 text-muted-foreground">
              <div>
                <p>Insights type: {isFallbackData ? 'Fallback Data' : 'AI Generated'}</p>
                <p>Summary length: {insights.summary?.length || 0} characters</p>
              </div>
              <div>
                <p>Categories: {insights.topCategories?.length || 0}</p>
                <p>Tips: {insights.savingTips?.length || 0}</p>
                <p>Recommendations: {insights.budgetRecommendations?.length || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
