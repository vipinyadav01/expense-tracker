"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Download, Calendar, Tag, DollarSign } from "lucide-react"
import { supabase, type Transaction } from "@/lib/supabase"
import { toast } from "sonner"
import EditTransactionDialog from "@/components/edit-transaction-dialog"
import ExportDialog from "@/components/export-dialog"

interface TransactionListProps {
  transactions: Transaction[]
  onUpdate: () => void
}

export default function TransactionList({ transactions, onUpdate }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showExport, setShowExport] = useState(false)

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id)

      if (error) throw error

      toast.success("Transaction deleted successfully!")
      onUpdate()
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Failed to delete transaction")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      full: date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      short: date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = `₹${Math.abs(amount).toLocaleString('en-IN')}`
    return type === "income" ? `+${formatted}` : `-${formatted}`
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-2">No transactions yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start tracking your finances by adding your first transaction
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header with export button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold">Transactions</h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowExport(true)}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-3">
        {transactions.map((transaction) => {
          const dateFormatted = formatDate(transaction.transaction_date)
          return (
            <Card 
              key={transaction.id} 
              className="transition-all duration-200 hover:shadow-md hover:border-primary/20"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header: Date and amount */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{dateFormatted.short}</span>
                    </div>
                    <Badge
                      variant={transaction.type === "income" ? "default" : "destructive"}
                      className={`text-sm font-medium ${
                        transaction.type === "income" 
                          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400" 
                          : ""
                      }`}
                    >
                      {formatAmount(Number.parseFloat(transaction.amount.toString()), transaction.type)}
                    </Badge>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-medium text-sm sm:text-base leading-tight">
                      {transaction.description}
                    </h4>
                  </div>

                  {/* Category and actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-muted/50">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: transaction.categories?.color || "#6B7280" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {transaction.categories?.name || "Other"}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(transaction.id)} 
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {transactions.map((transaction) => {
                const dateFormatted = formatDate(transaction.transaction_date)
                return (
                  <TableRow 
                    key={transaction.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {dateFormatted.full}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{transaction.description}</p>
                      </div>
                    </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: transaction.categories?.color || "#6B7280" }}
                    />
                        <span className="text-sm">
                    {transaction.categories?.name || "Other"}
                        </span>
                  </div>
                </TableCell>
                    <TableCell className="text-right">
                  <Badge
                    variant={transaction.type === "income" ? "default" : "destructive"}
                        className={`font-medium ${
                          transaction.type === "income" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400" 
                            : ""
                        }`}
                  >
                    {formatAmount(Number.parseFloat(transaction.amount.toString()), transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(transaction.id)} 
                            className="text-red-600 focus:text-red-600"
                          >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
                )
              })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Dialogs */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            onUpdate()
          }}
        />
      )}

      <ExportDialog open={showExport} onOpenChange={setShowExport} transactions={transactions} />
    </>
  )
}
