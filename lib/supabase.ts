import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Transaction {
  id: string
  user_id: string
  amount: number
  description: string
  category_id: string
  transaction_date: string
  type: "income" | "expense"
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: "monthly" | "yearly"
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  image_url?: string
  created_at: string
  updated_at: string
}

// Function to create or update user in Supabase
export async function createOrUpdateUser(userData: {
  id: string
  email: string
  first_name?: string
  last_name?: string
  image_url?: string
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          image_url: userData.image_url || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()

    if (error) {
      console.error('Error creating/updating user:', error)
      throw error
    }

    return data?.[0]
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error)
    throw error
  }
}

// Function to ensure user exists before operations
export async function ensureUserExists(userId: string, userEmail?: string) {
  try {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return existingUser
    }

    // If user doesn't exist, create with minimal data
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail || `user_${userId}@temp.com`, // Fallback email
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error ensuring user exists:', error)
      throw error
    }

    return data?.[0]
  } catch (error) {
    console.error('Error in ensureUserExists:', error)
    throw error
  }
}
