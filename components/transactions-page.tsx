"use client"

import React from "react"
import { useEffect, useState } from "react"
import { supabase, type Transaction } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Plus, X } from "lucide-react"
import Navbar from "@/components/navbar"
import TransactionList from "@/components/transaction-list"
import AddTransactionDialog from "@/components/add-transaction-dialog"
import ExportDialog from "@/components/export-dialog"

interface TransactionsPageProps {
  userId: string
}

export default function TransactionsPage({ userId }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showExport, setShowExport] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [userId])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, categoryFilter])

  const fetchData = async () => {
    try {
      const [transactionsResponse, categoriesResponse] = await Promise.all([
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
        supabase.from("categories").select("*").order("name"),
      ])

      setTransactions(transactionsResponse.data || [])
      setCategories(categoriesResponse.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.categories?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category_id === categoryFilter)
    }

    setFilteredTransactions(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setCategoryFilter("all")
  }

  const hasActiveFilters = searchTerm || typeFilter !== "all" || categoryFilter !== "all"

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 sm:w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track your financial transactions
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExport(true)}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <AddTransactionDialog onSuccess={fetchData} userId={userId} />
          </div>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Toggle for Mobile */}
        <div className="block sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {hasActiveFilters ? "Filters Applied" : "Show Filters"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[searchTerm, typeFilter !== "all", categoryFilter !== "all"].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: category.color }} 
                          />
                          <span className="truncate">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full h-9 sm:h-10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <div className="flex flex-wrap gap-1 w-full">
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {typeFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {typeFilter}
                      </Badge>
                    )}
                    {categoryFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Category: {categories.find(c => c.id === categoryFilter)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {filteredTransactions.length} of {transactions.length} transactions
            </span>
            {hasActiveFilters && (
              <Badge variant="outline" className="text-xs">
                Filtered
              </Badge>
            )}
          </div>
          {transactions.length > 0 && (
            <div className="text-xs">
              {filteredTransactions.length === transactions.length 
                ? "Showing all transactions" 
                : `Filtered from ${transactions.length} total`
              }
            </div>
          )}
        </div>

        {/* Transactions List */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 sm:p-0">
            <TransactionList 
              transactions={filteredTransactions} 
              onUpdate={fetchData} 
            />
          </CardContent>
        </Card>

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <Card className="p-8 sm:p-12">
            <div className="text-center">
              <div className="rounded-full bg-muted/50 p-4 w-fit mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "No matching transactions" : "No transactions yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {hasActiveFilters 
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "Start tracking your finances by adding your first transaction."
                }
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              ) : (
                <AddTransactionDialog onSuccess={fetchData} userId={userId} />
              )}
            </div>
          </Card>
        )}

        <ExportDialog open={showExport} onOpenChange={setShowExport} transactions={filteredTransactions} />
      </div>
    </div>
  )
}
