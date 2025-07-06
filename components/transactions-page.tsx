"use client"

import { useEffect, useState } from "react"
import { supabase, type Transaction } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold">Transactions</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <AddTransactionDialog onSuccess={fetchData} userId={userId} />
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
          {(searchTerm || typeFilter !== "all" || categoryFilter !== "all") && <span>Filters applied</span>}
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="p-6">
            <TransactionList transactions={filteredTransactions} onUpdate={fetchData} userId={userId} />
          </CardContent>
        </Card>

        <ExportDialog open={showExport} onOpenChange={setShowExport} transactions={filteredTransactions} />
      </div>
    </div>
  )
}
