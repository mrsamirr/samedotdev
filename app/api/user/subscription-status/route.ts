import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSubscription } from '@/lib/subscription'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with current plan and credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        currentPlan: true,
        creditsUsed: true,
        creditsTotal: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active subscription
    const subscription = await getUserSubscription(session.user.id)

    // Get current month feature usage
    const currentMonthYear = new Date().toISOString().slice(0, 7)
    const featureUsage = await prisma.featureUsage.findUnique({
      where: {
        userId_monthYear: {
          userId: session.user.id,
          monthYear: currentMonthYear
        }
      }
    })

    // Get recent credit usage
    const recentCreditUsage = await prisma.creditUsage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        creditsUsed: true,
        action: true,
        description: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currentPlan: user.currentPlan,
        creditsUsed: user.creditsUsed,
        creditsTotal: user.creditsTotal,
        creditsRemaining: user.creditsTotal - user.creditsUsed,
        memberSince: user.createdAt
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        nextBillingDate: subscription.nextBillingDate,
        creditsIncluded: subscription.creditsIncluded,
        startDate: subscription.startDate,
        cancelledAt: subscription.cancelledAt
      } : null,
      featureUsage: featureUsage ? {
        designFiles: featureUsage.designFiles,
        screenFlows: featureUsage.screenFlows,
        figmaExports: featureUsage.figmaExports,
        codeExports: featureUsage.codeExports,
        monthYear: featureUsage.monthYear
      } : {
        designFiles: 0,
        screenFlows: 0,
        figmaExports: 0,
        codeExports: 0,
        monthYear: currentMonthYear
      },
      recentActivity: recentCreditUsage
    })

  } catch (error) {
    console.error('Get user subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}