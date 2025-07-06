import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/transactions(.*)",
  "/budgets(.*)",
  "/insights(.*)"
])

export default clerkMiddleware(async (auth, req) => {
  // Only protect dashboard, transactions, budgets, insights
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  // Home page (/) and all other routes are public
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
