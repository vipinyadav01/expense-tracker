"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Download } from "lucide-react"
import { supabase, type Transaction } from "@/lib/supabase"
import { toast } from "sonner"
import EditTransactionDialog from "@/components/edit-transaction-dialog"
import ExportDialog from "@/components/export-dialog"

interface TransactionListProps {
  transactions: Transaction[]
  onUpdate: () => void
  userId: string
}

export default function TransactionList({ transactions, onUpdate, userId }: TransactionListProps) {
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
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = `₹${Math.abs(amount).toFixed(2)}`
    return type === "income" ? `+${formatted}` : `-${formatted}`
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: transaction.categories?.color || "#6B7280" }}
                    />
                    {transaction.categories?.name || "Other"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.type === "income" ? "default" : "destructive"}
                    className={transaction.type === "income" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                  >
                    {formatAmount(Number.parseFloat(transaction.amount.toString()), transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(transaction.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
