"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, CreditCard, Zap } from "lucide-react"

const creditPackages = [
  {
    credits: 360,
    price: 4,
    originalPrice: 5,
    popular: false,
    icon: "🪙"
  },
  {
    credits: 720,
    price: 8,
    originalPrice: 10,
    popular: true,
    icon: "🪙"
  },
  {
    credits: 1440,
    price: 16,
    originalPrice: 20,
    popular: false,
    icon: "🪙"
  },
  {
    credits: 2880,
    price: 32,
    originalPrice: 40,
    popular: false,
    icon: "🪙"
  }
]

export function CreditsSection() {
  const [selectedTab, setSelectedTab] = useState("credits")
  
  // Mock user data - replace with actual user data
  const userCredits = 1974
  const monthlyCredits = 1974
  const extraCredits = 0
  const usagePercentage = 28.7

  const handlePurchase = (credits: number, price: number) => {
    // Handle credit purchase logic here
    console.log(`Purchasing ${credits} credits for $${price}`)
  }

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Account Settings
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage your credits and subscription
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="account">Account Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="plan">Manage Plan</TabsTrigger>
            <TabsTrigger value="credits">Credits Information</TabsTrigger>
            <TabsTrigger value="usage">Credits Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="space-y-8">
            {/* Credit Balance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Your Credit Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Total Credits */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {userCredits.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">(2430)</span>
                      <span className="text-2xl text-green-600 ml-2">+ 0</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <div className="mt-2">
                      <Progress value={usagePercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{usagePercentage}%</p>
                    </div>
                    <Button variant="link" size="sm" className="text-xs mt-1">
                      How I spend my credits?
                    </Button>
                  </div>

                  {/* Monthly Credits */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {monthlyCredits.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Monthly Credits</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expire on 30/09/2025
                    </p>
                  </div>

                  {/* Extra Credits */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {extraCredits}
                    </div>
                    <p className="text-sm text-muted-foreground">Extra Credits</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      No expiration date
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buy Credits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Buy Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {creditPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">{pkg.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {pkg.credits.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Credits</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold">${pkg.price}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(pkg.credits, pkg.price)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tab contents can be added here */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Account information content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Manage Plan</CardTitle>
                <CardDescription>View and modify your subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Plan management content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Credits Usage</CardTitle>
                <CardDescription>Track your credit consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Usage statistics content goes here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}