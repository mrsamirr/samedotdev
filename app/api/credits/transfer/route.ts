import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Rate limiting for credit transfers (max 5 transfers per hour per user)
const transferRateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = transferRateLimit.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    transferRateLimit.set(userId, { count: 1, resetTime: now + 3600000 }) // 1 hour
    return true
  }
  
  if (userLimit.count >= 5) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientEmail, credits, reason } = await request.json()
    const senderId = session.user.id

    // Validate input
    if (!recipientEmail || !credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer parameters' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(senderId)) {
      return NextResponse.json(
        { error: 'Transfer rate limit exceeded. Max 5 transfers per hour.' },
        { status: 429 }
      )
    }

    // Minimum transfer amount for security
    if (credits < 10) {
      return NextResponse.json(
        { error: 'Minimum transfer amount is 10 credits' },
        { status: 400 }
      )
    }

    // Maximum transfer amount for security
    if (credits > 1000) {
      return NextResponse.json(
        { error: 'Maximum transfer amount is 1000 credits' },
        { status: 400 }
      )
    }

    // Find recipient user
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, email: true, name: true }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient user not found' },
        { status: 404 }
      )
    }

    // Prevent self-transfer
    if (recipient.id === senderId) {
      return NextResponse.json(
        { error: 'Cannot transfer credits to yourself' },
        { status: 400 }
      )
    }

    // Get sender's current balance
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { creditsTotal: true, creditsUsed: true, email: true, name: true }
    })

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    }

    const senderBalance = sender.creditsTotal - sender.creditsUsed

    if (senderBalance < credits) {
      return NextResponse.json(
        { error: 'Insufficient credits for transfer' },
        { status: 400 }
      )
    }

    // Generate transfer ID for tracking
    const transferId = crypto.randomUUID()

    // Perform the transfer in a transaction for security
    await prisma.$transaction(async (tx) => {
      // Deduct credits from sender
      await tx.user.update({
        where: { id: senderId },
        data: { creditsUsed: { increment: credits } }
      })

      // Add credits to recipient
      await tx.user.update({
        where: { id: recipient.id },
        data: { creditsTotal: { increment: credits } }
      })

      // Record sender's transaction
      await tx.creditUsage.create({
        data: {
          userId: senderId,
          creditsUsed: credits,
          action: 'credit_transfer_sent',
          description: `Transferred ${credits} credits to ${recipient.email}${reason ? `: ${reason}` : ''}`,
          resourceId: transferId
        }
      })

      // Record recipient's transaction
      await tx.creditUsage.create({
        data: {
          userId: recipient.id,
          creditsUsed: -credits, // Negative indicates credit addition
          action: 'credit_transfer_received',
          description: `Received ${credits} credits from ${sender.email}${reason ? `: ${reason}` : ''}`,
          resourceId: transferId
        }
      })
    })

    return NextResponse.json({
      success: true,
      transferId,
      transfer: {
        credits,
        recipient: {
          email: recipient.email,
          name: recipient.name
        },
        reason: reason || null
      }
    })

  } catch (error) {
    console.error('Credit transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to transfer credits' },
      { status: 500 }
    )
  }
}