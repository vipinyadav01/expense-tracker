import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import TransactionsPage from "@/components/transactions-page"

export default async function Transactions() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <TransactionsPage userId={userId} />
}
