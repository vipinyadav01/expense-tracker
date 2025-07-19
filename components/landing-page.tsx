import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Brain, IndianRupee, PieChart, Shield, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Subtle background pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-blue-200 dark:text-gray-700" />
      </svg>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          {/* Hero Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-6">
              <IndianRupee className="h-12 w-12 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Veritas Money</h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto md:mx-0">
              Take control of your finances with AI-powered insights, smart budgeting, and comprehensive expense tracking.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <SignUpButton mode="modal">
                <Button size="lg" className="px-8 focus:ring-2 focus:ring-blue-500">
                  Get Started Free
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="px-8 bg-transparent focus:ring-2 focus:ring-blue-500">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
          {/* Hero Illustration */}
          <div className="flex-1 flex justify-center md:justify-end">
            <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 md:w-80 md:h-52">
              <rect x="20" y="40" width="280" height="120" rx="24" fill="#e0e7ff" />
              <rect x="60" y="80" width="80" height="40" rx="12" fill="#6366f1" />
              <rect x="160" y="60" width="60" height="60" rx="12" fill="#38bdf8" />
              <rect x="230" y="90" width="40" height="20" rx="6" fill="#fbbf24" />
              <circle cx="70" cy="60" r="8" fill="#f87171" />
              <circle cx="250" cy="70" r="6" fill="#34d399" />
            </svg>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[{
            icon: <Brain className="h-8 w-8 text-blue-600 mb-2" />,
            title: "AI-Powered Insights",
            desc: "Get personalized financial advice and spending analysis powered by advanced AI"
          }, {
            icon: <PieChart className="h-8 w-8 text-green-600 mb-2" />,
            title: "Smart Budgeting",
            desc: "Set and track budgets with intelligent recommendations and alerts"
          }, {
            icon: <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />,
            title: "Visual Analytics",
            desc: "Beautiful charts and graphs to visualize your spending patterns"
          }, {
            icon: <Shield className="h-8 w-8 text-red-600 mb-2" />,
            title: "Secure & Private",
            desc: "Bank-level security with encrypted data and secure authentication"
          }, {
            icon: <Smartphone className="h-8 w-8 text-indigo-600 mb-2" />,
            title: "Mobile Optimized",
            desc: "Track expenses on the go with our responsive mobile interface"
          }, {
            icon: <IndianRupee className="h-8 w-8 text-yellow-600 mb-2" />,
            title: "Export & Reports",
            desc: "Export your data to CSV or PDF for tax preparation and analysis"
          }].map((feature, i) => (
            <Card
              key={feature.title}
              tabIndex={0}
              className="transition-transform transition-shadow duration-200 hover:scale-105 hover:shadow-2xl focus:scale-105 focus:shadow-2xl outline-none"
              aria-label={feature.title}
            >
              <CardHeader>
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Transform Your Finances?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of users who have taken control of their financial future
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" className="px-12 focus:ring-2 focus:ring-blue-500">
              Start Your Financial Journey
            </Button>
          </SignUpButton>
        </div>
      </div>
    </div>
  )
}
