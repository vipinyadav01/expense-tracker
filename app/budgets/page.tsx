import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import BudgetsPage from "@/components/budgets-page"

export default async function Budgets() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <BudgetsPage userId={userId} />
}
