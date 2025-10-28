"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Coins, Plus, CreditCard } from "lucide-react"

const quickCreditPackages = [
  { credits: 360, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_360 || '', icon: "🪙" },
  { credits: 720, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_720 || '', icon: "🪙" },
  { credits: 1440, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_1440 || '', icon: "🪙" },
  { credits: 2880, productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_2880 || '', icon: "🪙" }
]

export function CreditsDropdown() {
  const [userCredits] = useState(1974) // Mock user credits
  const [buying, setBuying] = useState<string | null>(null)
  
  const buyCreditsWithDodo = async (productId: string, amount: number) => {
    try {
      setBuying(String(amount))
      console.log('Buy credits clicked:', { productId, amount })
      
      if (!productId) {
        alert('Credit pack is not configured. Please set NEXT_PUBLIC_DODO_CREDIT_PACK_* env vars.')
        return
      }
      
      const requestBody = { 
        productId, 
        returnUrl: `${window.location.origin}/credits`,
        cancelUrl: `${window.location.origin}/credits`
      }
      
      const res = await fetch('/api/dodopayments/create-credit-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(`Error: ${data?.error || 'Failed to create payment link'}`)
      } else if (!data?.url) {
        alert('No payment URL returned from server')
      } else {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-white/90">
          <Coins className="h-4 w-4 text-yellow-600" />
          <span className="font-medium">{userCredits.toLocaleString()}</span>
          <Plus className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end">
        <DropdownMenuLabel className="flex items-center gap-2 text-base">
          <Coins className="h-5 w-5 text-yellow-600" />
          Buy Credits
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="space-y-2">
          {quickCreditPackages.map((pkg, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">{pkg.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {pkg.credits.toLocaleString()} Credits
                  </p>
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => buyCreditsWithDodo(pkg.productId, pkg.credits)}
                disabled={buying === String(pkg.credits) || !pkg.productId}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50"
              >
                {buying === String(pkg.credits) ? 'Processing...' : (!pkg.productId ? 'Not Configured' : 'Buy')}
              </Button>
            </div>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a href="/credits" className="flex items-center gap-2 cursor-pointer">
            <CreditCard className="h-4 w-4" />
            <span>View All Plans</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}