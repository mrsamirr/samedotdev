"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, CreditCard, Users, Zap } from 'lucide-react'

interface SubscriptionData {
  user: {
    id: string
    name: string
    email: string
    currentPlan: string
    creditsUsed: number
    creditsTotal: number
    creditsRemaining: number
    memberSince: string
  }
  subscription: {
    id: string
    plan: string
    status: string
    billingCycle: string
    amount: number
    nextBillingDate: string
    creditsIncluded: number
    startDate: string
    cancelledAt?: string
  } | null
  featureUsage: {
    designFiles: number
    screenFlows: number
    figmaExports: number
    codeExports: number
    monthYear: string
  }
  recentActivity: Array<{
    id: string
    creditsUsed: number
    action: string
    description: string
    createdAt: string
  }>
}

export default function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/user/subscription-status')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError('Failed to load subscription status')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' })
      })

      if (response.ok) {
        alert('Subscription cancelled successfully')
        fetchSubscriptionStatus() // Refresh data
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to cancel subscription')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleSyncSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/sync', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Subscription synced successfully')
        fetchSubscriptionStatus() // Refresh data
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to sync subscription')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error || 'Failed to load subscription data'}</p>
        </CardContent>
      </Card>
    )
  }

  const { user, subscription, featureUsage, recentActivity } = data
  const creditsPercentage = (user.creditsUsed / user.creditsTotal) * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      case 'SUSPENDED': return 'bg-yellow-500'
      case 'EXPIRED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Plan: {user.currentPlan}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Credits Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {user.creditsUsed}</span>
                  <span>Total: {user.creditsTotal}</span>
                </div>
                <Progress value={creditsPercentage} className="h-2" />
                <p className="text-sm text-gray-600">
                  {user.creditsRemaining} credits remaining
                </p>
              </div>
            </div>

            {subscription && (
              <div>
                <h4 className="font-medium mb-2">Subscription Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing:</span>
                    <span>${subscription.amount}/{subscription.billingCycle}</span>
                  </div>
                  {subscription.nextBillingDate && (
                    <div className="flex justify-between">
                      <span>Next billing:</span>
                      <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {subscription && subscription.status === 'ACTIVE' && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncSubscription}
              >
                Sync Status
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            This Month&apos;s Usage ({featureUsage.monthYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{featureUsage.designFiles}</div>
              <div className="text-sm text-gray-600">Design Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{featureUsage.screenFlows}</div>
              <div className="text-sm text-gray-600">Screen Flows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{featureUsage.figmaExports}</div>
              <div className="text-sm text-gray-600">Figma Exports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{featureUsage.codeExports}</div>
              <div className="text-sm text-gray-600">Code Exports</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    -{activity.creditsUsed} credits
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}