import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Dashboard from "@/components/dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <Dashboard userId={userId} />
}
