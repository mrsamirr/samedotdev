import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dodopayments } from '@/lib/dodopayments'
import { cancelSubscription } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    try {
      // Cancel subscription with DodoPayments (SDK may not expose typed cancel)
      const subsAny = (dodopayments.subscriptions as unknown) as { cancel?: (id: string, params?: { reason?: string }) => Promise<unknown> }
      if (typeof subsAny.cancel === 'function') {
        await subsAny.cancel(subscription.dodopaymentsSubscriptionId, {
          reason: reason || 'User requested cancellation',
        })
      } else {
        console.warn('DodoPayments subscriptions.cancel not available in SDK, skipping remote cancel')
      }
    } catch (dodoError) {
      console.error('DodoPayments cancellation failed:', dodoError)
      // Continue with local cancellation even if DodoPayments fails
    }

    // Cancel subscription locally
    const cancelledSubscription = await cancelSubscription(subscription.id)

    return NextResponse.json({
      success: true,
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelledAt: cancelledSubscription.cancelledAt
      }
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}