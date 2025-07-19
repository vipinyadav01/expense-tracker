import { auth, currentUser } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

// Get or create user in Supabase
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: userId,
            email: user.emailAddresses[0]?.emailAddress || "",
            first_name: user.firstName || "",
            last_name: user.lastName || "",
            image_url: user.imageUrl || "",
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError
      return NextResponse.json(newUser)
    }

    // Update user info if it exists (in case of changes in Clerk)
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        email: user.emailAddresses[0]?.emailAddress || existingUser.email,
        first_name: user.firstName || existingUser.first_name,
        last_name: user.lastName || existingUser.last_name,
        image_url: user.imageUrl || existingUser.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateError) throw updateError
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error syncing user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name } = body

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
