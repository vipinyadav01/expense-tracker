"use client"

import { UserButton, useAuth, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { IndianRupee, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Transactions", href: "/transactions" },
    { name: "Budgets", href: "/budgets" },
    { name: "Insights", href: "/insights" },
  ]

  return (
    <nav
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-background/90 border shadow-xl rounded-2xl backdrop-blur supports-[backdrop-filter]:bg-background/60 w-[95vw] max-w-2xl px-4 py-2"
      style={{
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      }}
    >
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <IndianRupee className="h-6 w-6 text-blue-600" />
            <span className="font-anurati text-2xl">Expense Tracker</span>
          </Link>
        </div>

        {isLoaded && isSignedIn && (
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2 md:space-x-4">
          <ModeToggle />
          {isLoaded && isSignedIn ? (
            <>
              <UserButton afterSignOutUrl="/" />
              {/* Mobile Navigation */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-sm font-medium transition-colors hover:text-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <SignInButton mode="modal">
              <Button size="sm" className="px-4">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  )
}
