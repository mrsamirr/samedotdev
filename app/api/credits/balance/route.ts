import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's current credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditsTotal: true,
        creditsUsed: true,
        currentPlan: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent credit usage history
    const recentUsage = await prisma.creditUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        creditsUsed: true,
        action: true,
        description: true,
        createdAt: true,
        resourceId: true
      }
    })

    // Get current month's feature usage
    const currentMonthYear = new Date().toISOString().slice(0, 7)
    const featureUsage = await prisma.featureUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear: currentMonthYear
        }
      }
    })

    const creditsRemaining = user.creditsTotal - user.creditsUsed

    return NextResponse.json({
      balance: {
        total: user.creditsTotal,
        used: user.creditsUsed,
        remaining: creditsRemaining,
        percentage: user.creditsTotal > 0 ? (user.creditsUsed / user.creditsTotal) * 100 : 0
      },
      plan: user.currentPlan,
      recentUsage,
      featureUsage: featureUsage || {
        designFiles: 0,
        screenFlows: 0,
        figmaExports: 0,
        codeExports: 0
      }
    })

  } catch (error) {
    console.error('Get credit balance error:', error)
    return NextResponse.json(
      { error: 'Failed to get credit balance' },
      { status: 500 }
    )
  }
}