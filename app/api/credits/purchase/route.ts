import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits, reason } = await request.json()

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }

    // Security: impose min/max per purchase to prevent abuse
    if (credits < 50) {
      return NextResponse.json({ error: 'Minimum purchase is 50 credits' }, { status: 400 })
    }
    if (credits > 10000) {
      return NextResponse.json({ error: 'Purchase amount too large' }, { status: 400 })
    }

    // NOTE: Assume payment is already verified externally (webhook). This is a manual top-up endpoint.
    const userId = session.user.id

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { creditsTotal: { increment: credits } }
      })

      await tx.creditUsage.create({
        data: {
          userId,
          creditsUsed: -credits, // Negative to indicate credit addition
          action: 'credit_purchase',
          description: `Purchased ${credits} credits${reason ? `: ${reason}` : ''}`
        }
      })
    })

    return NextResponse.json({ success: true, creditsAdded: credits })
  } catch (error) {
    console.error('Credit purchase error:', error)
    return NextResponse.json({ error: 'Failed to purchase credits' }, { status: 500 })
  }
}
