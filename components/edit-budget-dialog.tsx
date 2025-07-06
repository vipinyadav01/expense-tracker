"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase, type Budget, type Category } from "@/lib/supabase"
import { toast } from "sonner"

interface EditBudgetDialogProps {
  budget: Budget
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  categories: Category[]
}

export default function EditBudgetDialog({ budget, open, onOpenChange, onSuccess, categories }: EditBudgetDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category_id: budget.category_id,
    amount: budget.amount.toString(),
    period: budget.period,
  })

  useEffect(() => {
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
    })
  }, [budget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date()
      let startDate: string
      let endDate: string

      if (formData.period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
      } else {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
      }

      const { error } = await supabase
        .from("budgets")
        .update({
          category_id: formData.category_id,
          amount: Number.parseFloat(formData.amount),
          period: formData.period,
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budget.id)

      if (error) throw error

      toast.success("Budget updated successfully!")
      onSuccess()
    } catch (error) {
      console.error("Error updating budget:", error)
      toast.error("Failed to update budget")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update your budget settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Budget Period</Label>
            <RadioGroup
              value={formData.period}
              onValueChange={(value: "monthly" | "yearly") => setFormData({ ...formData, period: value })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly">Yearly</Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
