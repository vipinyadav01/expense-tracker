"use client"

import type React from "react"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus } from "lucide-react"
import { supabase, type Category } from "@/lib/supabase"
import { toast } from "sonner"

interface AddBudgetDialogProps {
  onSuccess: () => void
  userId: string
  categories: Category[]
}

export default function AddBudgetDialog({ onSuccess, userId, categories }: AddBudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
  })

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

      // Check if budget already exists for this category and period
      const { data: existingBudget } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", userId)
        .eq("category_id", formData.category_id)
        .eq("period", formData.period)
        .single()

      if (existingBudget) {
        toast.error(`A ${formData.period} budget already exists for this category`)
        return
      }

      const { error } = await supabase.from("budgets").insert([
        {
          user_id: userId,
          category_id: formData.category_id,
          amount: Number.parseFloat(formData.amount),
          period: formData.period,
          start_date: startDate,
          end_date: endDate,
        },
      ])

      if (error) throw error

      toast.success("Budget created successfully!")
      setOpen(false)
      setFormData({
        category_id: "",
        amount: "",
        period: "monthly",
      })
      onSuccess()
    } catch (error) {
      console.error("Error creating budget:", error)
      toast.error("Failed to create budget")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>Set a spending limit for a specific category.</DialogDescription>
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
                <SelectValue placeholder="Select a category" />
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
              placeholder="0.00"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
