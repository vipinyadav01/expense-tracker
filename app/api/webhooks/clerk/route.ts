import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data)
        break
      case "user.updated":
        await handleUserUpdated(evt.data)
        break
      case "user.deleted":
        await handleUserDeleted(evt.data)
        break
      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ message: "Webhook processed successfully" })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Error occurred", { status: 500 })
  }
}

async function handleUserCreated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData

  const { error } = await supabase.from("users").insert([
    {
      id,
      email: email_addresses[0]?.email_address || "",
      first_name: first_name || "",
      last_name: last_name || "",
      image_url: image_url || "",
    },
  ])

  if (error) {
    console.error("Error creating user in Supabase:", error)
    throw error
  }

  console.log("User created in Supabase:", id)
}

async function handleUserUpdated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData

  const { error } = await supabase
    .from("users")
    .update({
      email: email_addresses[0]?.email_address || "",
      first_name: first_name || "",
      last_name: last_name || "",
      image_url: image_url || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating user in Supabase:", error)
    throw error
  }

  console.log("User updated in Supabase:", id)
}

async function handleUserDeleted(userData: any) {
  const { id } = userData

  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("Error deleting user from Supabase:", error)
    throw error
  }

  console.log("User deleted from Supabase:", id)
}
