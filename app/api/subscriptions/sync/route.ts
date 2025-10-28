import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dodopayments } from '@/lib/dodopayments'
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const syncResults = []

    for (const subscription of subscriptions) {
      try {
        // Fetch subscription status from DodoPayments
        const dodoSubscription = await dodopayments.subscriptions.retrieve(
          subscription.dodopaymentsSubscriptionId
        )

        // Map DodoPayments status to our status
        let newStatus: SubscriptionStatus
        switch (dodoSubscription.status?.toLowerCase()) {
          case 'active':
            newStatus = SubscriptionStatus.ACTIVE
            break
          case 'cancelled':
          case 'canceled':
            newStatus = SubscriptionStatus.CANCELLED
            break
          case 'suspended':
            newStatus = SubscriptionStatus.SUSPENDED
            break
          case 'expired':
            newStatus = SubscriptionStatus.EXPIRED
            break
          default:
            newStatus = SubscriptionStatus.PENDING
        }

        // Update subscription if status changed
        if (subscription.status !== newStatus) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: newStatus,
              ...(newStatus === SubscriptionStatus.CANCELLED && {
                cancelledAt: new Date()
              })
            }
          })

          // Update user plan if subscription was cancelled
          if (newStatus === SubscriptionStatus.CANCELLED) {
            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                currentPlan: SubscriptionPlan.FREE,
                creditsTotal: 90 // Free plan credits
              }
            })
          }
        }

        syncResults.push({
          subscriptionId: subscription.id,
          oldStatus: subscription.status,
          newStatus,
          synced: subscription.status !== newStatus
        })

      } catch (dodoError) {
        console.error(`Failed to sync subscription ${subscription.id}:`, dodoError)
        syncResults.push({
          subscriptionId: subscription.id,
          error: 'Failed to fetch from DodoPayments'
        })
      }
    }

    return NextResponse.json({
      success: true,
      syncResults,
      message: `Synced ${syncResults.length} subscriptions`
    })

  } catch (error) {
    console.error('Sync subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscriptions' },
      { status: 500 }
    )
  }
}