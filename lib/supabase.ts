import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Transaction = {
  id: string
  user_id: string
  amount: number
  description: string
  category_id: string
  transaction_date: string
  type: "income" | "expense"
  created_at: string
  updated_at: string
  categories?: Category
}

export type Category = {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: "monthly" | "yearly"
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  categories?: Category
}
