import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SubscriptionStatus, PaymentStatus, SubscriptionPlan, BillingCycle, Prisma } from '@prisma/client'
import { createSubscription } from '@/lib/subscription'

export const runtime = 'nodejs'

// DodoPayments webhook events
interface DodoPaymentsWebhookEvent {
  type: string
  data: {
    id: string
    status: string
    customer: {
      email: string
      name: string
    }
    product_id: string
    amount: number
    currency: string
    billing_cycle?: string
    next_billing_date?: string
    cancelled_at?: string
    metadata?: Record<string, unknown>
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on DodoPayments documentation)
    const signature = request.headers.get('dodo-signature')
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY

    const isDev = process.env.NODE_ENV !== 'test'
    if (!isDev) {
      if (!signature || !webhookSecret) {
        console.error('Missing webhook signature or secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // TODO: Implement signature verification in production
    } else {
      // In development, skip signature verification to ease local testing
      if (!signature || !webhookSecret) {
        console.warn('Skipping webhook signature check in development.')
      }
    }

    const event: DodoPaymentsWebhookEvent = await request.json()
    console.log('DodoPayments webhook received:', event.type, event.data.id)

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.activated':
        await handleSubscriptionActivated(event.data)
        break

      case 'subscription.cancelled':
      case 'subscription.canceled':
        await handleSubscriptionCancelled(event.data)
        break

      case 'subscription.suspended':
        await handleSubscriptionSuspended(event.data)
        break

      case 'payment.completed':
        // Handle credit pack or invoice payments
        await handlePaymentCompleted(event.data)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.data)
        break

      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionActivated(data: DodoPaymentsWebhookEvent['data']) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.customer.email }
    })

    if (!user) {
      console.error('User not found for subscription:', data.customer.email)
      return
    }

    // Map product ID to subscription plan
    const standardMonthly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_MONTHLY
    const standardYearly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_YEARLY
    const proMonthly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_MONTHLY
    const proYearly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_YEARLY

    if (!standardMonthly || !standardYearly || !proMonthly || !proYearly) {
      console.error('Missing DodoPayments plan ID env vars. Ensure NEXT_PUBLIC_DODOPAYMENTS_PLAN_* are set.')
    }

    const planMapping = {
      [standardMonthly || '']: { plan: SubscriptionPlan.STANDARD, cycle: BillingCycle.MONTHLY, credits: 420 },
      [standardYearly || '']: { plan: SubscriptionPlan.STANDARD, cycle: BillingCycle.YEARLY, credits: 420 * 12 },
      [proMonthly || '']: { plan: SubscriptionPlan.PRO, cycle: BillingCycle.MONTHLY, credits: 1200 },
      [proYearly || '']: { plan: SubscriptionPlan.PRO, cycle: BillingCycle.YEARLY, credits: 1200 * 12 }
    }

    const planConfig = planMapping[data.product_id as keyof typeof planMapping]
    if (!planConfig) {
      console.error('Unknown product ID (no plan mapping):', data.product_id)
      return
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { dodopaymentsSubscriptionId: data.id }
    })

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : null
        }
      })

      // Ensure user plan/credits reflect the active subscription
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentPlan: planConfig.plan,
          creditsTotal: planConfig.credits,
          creditsUsed: 0
        }
      })
    } else {
      // Create new subscription and update user's credits inside helper
      await createSubscription({
        userId: user.id,
        dodopaymentsSubscriptionId: data.id,
        dodopaymentsPlanId: data.product_id,
        plan: planConfig.plan,
        billingCycle: planConfig.cycle,
        amount: data.amount,
        nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined
      })
    }

    console.log('Subscription activated for user:', user.email)

  } catch (error) {
    console.error('Error handling subscription activation:', error)
  }
}

async function handleSubscriptionCancelled(data: DodoPaymentsWebhookEvent['data']) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { dodopaymentsSubscriptionId: data.id }
    })

    if (!subscription) {
      console.error('Subscription not found:', data.id)
      return
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : new Date()
      }
    })

    // Downgrade user to free plan
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        currentPlan: SubscriptionPlan.FREE,
        creditsTotal: 90 // Free plan credits
      }
    })

    console.log('Subscription cancelled:', data.id)

  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function handleSubscriptionSuspended(data: DodoPaymentsWebhookEvent['data']) {
  try {
    await prisma.subscription.updateMany({
      where: { dodopaymentsSubscriptionId: data.id },
      data: { status: SubscriptionStatus.SUSPENDED }
    })

    console.log('Subscription suspended:', data.id)

  } catch (error) {
    console.error('Error handling subscription suspension:', error)
  }
}

async function handlePaymentCompleted(data: DodoPaymentsWebhookEvent['data']) {
  try {
    // Credit pack handling via metadata.type
    if (data.metadata?.type === 'credit_pack') {
      // Map credit pack product IDs to credit amounts
      const pack360 = process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_360
      const pack720 = process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_720
      const pack1440 = process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_1440
      const pack2880 = process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_2880

      const mapping: Record<string, number> = {}
      if (pack360) mapping[pack360] = 360
      if (pack720) mapping[pack720] = 720
      if (pack1440) mapping[pack1440] = 1440
      if (pack2880) mapping[pack2880] = 2880

      const credits = mapping[data.product_id] || 0

      const user = await prisma.user.findUnique({ where: { email: data.customer.email } })
      if (!user) {
        console.error('Payment completed for unknown user:', data.customer.email)
        return
      }

      if (credits > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { creditsTotal: { increment: credits } }
        })

        await prisma.creditUsage.create({
          data: {
            userId: user.id,
            creditsUsed: -credits,
            action: 'credit_purchase',
            description: `Purchased ${credits} credits via DodoPayments`,
            resourceId: data.id
          }
        })

        console.log(`Added ${credits} credits to ${user.email}`)
      } else {
        console.warn('Credit pack product not mapped:', data.product_id)
      }

      return
    }

    // Subscription payment fallback (link by subscription id or metadata)
    const subscription = await prisma.subscription.findUnique({
      where: { dodopaymentsSubscriptionId: data.id }
    })

    if (subscription) {
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          dodopaymentsPaymentId: data.id,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.COMPLETED,
          paymentDate: new Date(),
          metadata: (data.metadata as unknown as Prisma.InputJsonValue) || undefined
        }
      })

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.ACTIVE }
      })
    } else {
      console.warn('Payment completed but subscription not found for id:', data.id)
    }

    console.log('Payment completed:', data.id)

  } catch (error) {
    console.error('Error handling payment completion:', error)
  }
}

async function handlePaymentFailed(data: DodoPaymentsWebhookEvent['data']) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { dodopaymentsSubscriptionId: data.id }
    })

    if (subscription) {
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          dodopaymentsPaymentId: data.id,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.FAILED,
          metadata: (data.metadata as unknown as Prisma.InputJsonValue) || undefined
        }
      })

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.SUSPENDED }
      })
    } else {
      console.warn('Payment failed but subscription not found for id:', data.id)
    }

    console.log('Payment failed:', data.id)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}