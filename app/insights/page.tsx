import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import InsightsPage from "@/components/insights-page"

export const dynamic = "force-dynamic"

export default async function Insights() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <InsightsPage userId={userId} />
}
