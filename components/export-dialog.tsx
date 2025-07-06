"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download, FileText, Table } from "lucide-react"
import type { Transaction } from "@/lib/supabase"
import { toast } from "sonner"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
}

export default function ExportDialog({ open, onOpenChange, transactions }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv")
  const [loading, setLoading] = useState(false)

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"]
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [t.transaction_date, `"${t.description}"`, `"${t.categories?.name || "Other"}"`, t.type, t.amount].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = async () => {
    // Simple PDF generation using HTML and print
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount.toString()), 0)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; padding: 20px; background: #f5f5f5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .income { color: green; }
            .expense { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transaction Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Income:</strong> ₹${totalIncome.toFixed(2)}</p>
            <p><strong>Total Expenses:</strong> ₹${totalExpenses.toFixed(2)}</p>
            <p><strong>Net Income:</strong> ₹${(totalIncome - totalExpenses).toFixed(2)}</p>
            <p><strong>Total Transactions:</strong> ${transactions.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (t) => `
                <tr>
                  <td>${new Date(t.transaction_date).toLocaleDateString()}</td>
                  <td>${t.description}</td>
                  <td>${t.categories?.name || "Other"}</td>
                  <td>${t.type}</td>
                  <td class="${t.type}">₹${Number.parseFloat(t.amount.toString()).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>Choose the format to export your transactions</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <RadioGroup
              id="format"
              value={format}
              onValueChange={setFormat}
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label htmlFor="format-pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={format === "csv" ? exportToCSV : exportToPDF}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}