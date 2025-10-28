"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// DodoPayments credit packs - matching the plans page
const CREDIT_PACKS: { credits: number; productId: string }[] = [
  { credits: 360, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_360 || '' },
  { credits: 720, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_720 || '' },
  { credits: 1440, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_1440 || '' },
  { credits: 2880, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_2880 || '' },
]

export function UXPilotCredits() {
  const [activeTab, setActiveTab] = useState("credits")
  
  // Mock user data
  const userCredits = 1974
  const monthlyCredits = 1974
  const extraCredits = 0
  const usagePercentage = 28.7

  const [buying, setBuying] = useState<string | null>(null)

  const buyCreditsWithDodo = async (productId: string, amount: number) => {
    try {
      setBuying(String(amount))
      console.log('Buy credits clicked:', { productId, amount })
      
      if (!productId) {
        alert('Credit pack is not configured. Please set NEXT_PUBLIC_DODO_CREDIT_PACK_* env vars.')
        return
      }
      
      console.log('Making request to /api/dodopayments/create-credit-pack')
      
      const requestBody = { 
        productId, 
        returnUrl: `${window.location.origin}/credits`,
        cancelUrl: `${window.location.origin}/credits`
      }
      
      console.log('Request body:', requestBody)
      
      const res = await fetch('/api/dodopayments/create-credit-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', res.status)
      console.log('Response ok:', res.ok)
      
      const data = await res.json()
      console.log('Credit pack response:', data)
      
      if (!res.ok) {
        alert(`Error: ${data?.error || 'Failed to create payment link'}\nDetails: ${data?.details || 'No details'}`)
      } else if (!data?.url) {
        alert('No payment URL returned from server')
      } else {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      }
    } catch (e) {
      console.error('Credit pack error:', e)
      alert(`Network error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setBuying(null)
    }
  }

  return (
    <section className="py-16 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h1>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("account")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "account"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Account Information
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "security"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab("plan")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "plan"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Manage Plan
              </button>
              <button
                onClick={() => setActiveTab("credits")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "credits"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Credits Information
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "usage"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Credits Usage
              </button>
            </nav>
          </div>
        </div>

        {/* Credits Tab Content */}
        {activeTab === "credits" && (
          <div className="space-y-8">
            {/* Credit Balance Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Credit Balance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Credits */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {userCredits.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">(2430)</span>
                    <span className="text-2xl text-green-600 ml-2">+ 0</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Total Credits</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${usagePercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{usagePercentage}%</p>
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    How I spend my credits?
                  </button>
                </div>

                {/* Monthly Credits */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {monthlyCredits.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Monthly Credits</p>
                  <p className="text-xs text-gray-500">
                    Expire on 30/09/2025
                  </p>
                </div>

                {/* Extra Credits */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {extraCredits}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Extra Credits</p>
                  <p className="text-xs text-gray-500">
                    No expiration date
                  </p>
                </div>
              </div>
            </div>

            {/* Buy Credits Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Buy Credits</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {CREDIT_PACKS.map((pack, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-200"
                  >
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {pack.credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">Credits</div>
                    <Button
                      onClick={() => buyCreditsWithDodo(pack.productId, pack.credits)}
                      disabled={buying === String(pack.credits) || !pack.productId}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      {buying === String(pack.credits) ? 'Processing...' : (!pack.productId ? 'Not Configured' : 'Buy')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Tab Contents */}
        {activeTab === "account" && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
            <p className="text-gray-600">Account information content goes here...</p>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
            <p className="text-gray-600">Security settings content goes here...</p>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Plan</h2>
            <p className="text-gray-600">Plan management content goes here...</p>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Credits Usage</h2>
            <p className="text-gray-600">Usage statistics content goes here...</p>
          </div>
        )}
      </div>
    </section>
  )
}