"use client"

import { UserButton, useAuth, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  IndianRupee, 
  Menu, 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  Brain,
  MoreVertical
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      description: "Overview of your finances"
    },
    { 
      name: "Transactions", 
      href: "/transactions", 
      icon: CreditCard,
      description: "Manage your income and expenses"
    },
    { 
      name: "Budgets", 
      href: "/budgets", 
      icon: Target,
      description: "Set and track spending limits"
    },
    { 
      name: "Insights", 
      href: "/insights", 
      icon: Brain,
      description: "AI-powered financial analysis"
    },
  ]

  return (
    <TooltipProvider>
      <nav
        className="fixed top-4 left-1/2 z-50 -translate-x-1/2 bg-background/95 border shadow-2xl rounded-2xl backdrop-blur-md supports-[backdrop-filter]:bg-background/80 w-[95vw] max-w-4xl px-3 sm:px-6 py-3"
        style={{
          boxShadow: "0 10px 40px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={isSignedIn ? "/dashboard" : "/"} 
              className="flex items-center space-x-2 group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200 shadow-lg group-hover:shadow-xl group-hover:scale-105">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent sm:block hidden">
                Expense Tracker
              </span>
              <span className="font-bold text-sm bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent sm:hidden block">
                ExpenseTracker
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Icons Only with Tooltips */}
          {isLoaded && isSignedIn && (
            <div className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => {
                const IconComponent = item.icon
                return (
                  <Tooltip key={item.name} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="group relative h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-200"
                        >
                          <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border shadow-lg">
                      <div className="text-center">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Mode Toggle */}
            <div className="hidden sm:block">
              <ModeToggle />
            </div>

            {isLoaded && isSignedIn ? (
              <>
                {/* User Button - Always Visible */}
                <div className="hidden sm:block">
                  <UserButton 
                    afterSignOutUrl="/" 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 hover:scale-105 transition-transform duration-200"
                      }
                    }}
                  />
                </div>

                {/* Mobile User Button */}
                <div className="sm:hidden">
                  <UserButton 
                    afterSignOutUrl="/" 
                    appearance={{
                      elements: {
                        avatarBox: "w-7 h-7"
                      }
                    }}
                  />
                </div>

                {/* Mobile Menu - 3 Dots */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-80 sm:w-96 bg-background/95 backdrop-blur-md border-l"
                  >
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center space-x-3 pb-6 border-b">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                          <IndianRupee className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg">Expense Tracker</h2>
                          <p className="text-xs text-muted-foreground">Financial Management</p>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="flex flex-col space-y-2 pt-6 flex-1">
                        {navigation.map((item) => {
                          const IconComponent = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 border border-transparent hover:border-primary/10"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <IconComponent className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>

                      {/* Mobile Actions */}
                      <div className="pt-6 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Theme</span>
                          <ModeToggle />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Account</span>
                          <UserButton 
                            afterSignOutUrl="/" 
                            appearance={{
                              elements: {
                                avatarBox: "w-8 h-8"
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button 
                  size="sm" 
                  className="px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
