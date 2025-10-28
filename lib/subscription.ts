import { prisma } from '@/lib/prisma'
import { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@prisma/client'

// Plan configurations
export const PLAN_CONFIGS = {
  FREE: {
    credits: 90,
    designFiles: 0, // No limit tracking for free
    screenFlows: 0,
    features: ['HiFi UI', 'Wireframe', 'Design Review', 'Predictive Heatmap']
  },
  STANDARD: {
    credits: 420,
    designFiles: 5,
    screenFlows: 5,
    features: [
      'HiFi UI', 'Wireframe', 'Design Review', 'Predictive Heatmap',
      'Export to Figma', 'Export code', 'Design Files (max. 5)',
      'Screen Flows (max. 5 screens)'
    ]
  },
  PRO: {
    credits: 1200,
    designFiles: -1, // -1 means unlimited
    screenFlows: -1,
    features: [
      'HiFi UI', 'Wireframe', 'Design Review', 'Predictive Heatmap',
      'Export to Figma', 'Export code', 'Design Files (unlimited)',
      'Screen Flows (unlimited)'
    ]
  }
} as const

function getPlanConfig(plan: SubscriptionPlan) {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return PLAN_CONFIGS.FREE
    case SubscriptionPlan.STANDARD:
      return PLAN_CONFIGS.STANDARD
    case SubscriptionPlan.PRO:
      return PLAN_CONFIGS.PRO
    default:
      // Fallback to FREE if new enum values exist that we do not support yet
      return PLAN_CONFIGS.FREE
  }
}

export async function createSubscription(data: {
  userId: string
  dodopaymentsSubscriptionId: string
  dodopaymentsPlanId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  amount: number
  nextBillingDate?: Date
}) {
  const config = getPlanConfig(data.plan)
  
  const subscription = await prisma.subscription.create({
    data: {
      userId: data.userId,
      dodopaymentsSubscriptionId: data.dodopaymentsSubscriptionId,
      dodopaymentsPlanId: data.dodopaymentsPlanId,
      plan: data.plan,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: data.billingCycle,
      amount: data.amount,
      creditsIncluded: config.credits,
      nextBillingDate: data.nextBillingDate,
    }
  })

  // Update user's current plan and credits
  await prisma.user.update({
    where: { id: data.userId },
    data: {
      currentPlan: data.plan,
      creditsTotal: config.credits,
      creditsUsed: 0, // Reset credits used when upgrading
    }
  })

  return subscription
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    }
  })

  // Optionally downgrade user to free plan immediately or at end of billing period
  // For immediate downgrade:
  await prisma.user.update({
    where: { id: subscription.userId },
    data: {
      currentPlan: SubscriptionPlan.FREE,
      creditsTotal: getPlanConfig(SubscriptionPlan.FREE).credits,
    }
  })

  return subscription
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.SUSPENDED]
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })
}

// Rate limiting for actions (per user per hour)
const actionRateLimit = new Map<string, { count: number; resetTime: number }>()

function checkActionRateLimit(userId: string, action: string, maxActions: number = 50): boolean {
  const key = `${userId}:${action}`
  const now = Date.now()
  const userLimit = actionRateLimit.get(key)
  
  if (!userLimit || now > userLimit.resetTime) {
    actionRateLimit.set(key, { count: 1, resetTime: now + 3600000 }) // 1 hour
    return true
  }
  
  if (userLimit.count >= maxActions) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function canUserPerformAction(userId: string, action: string, creditsRequired: number = 6) {
  // Input validation
  if (!userId || !action || creditsRequired < 0) {
    return { allowed: false, reason: 'Invalid parameters' }
  }

  // Rate limiting check
  const rateLimits = {
    'generate_design': 30,
    'create_design_file': 20,
    'create_screen_flow': 15,
    'export_figma': 10,
    'export_code': 10
  }
  
  const maxActions = rateLimits[action as keyof typeof rateLimits] || 50
  if (!checkActionRateLimit(userId, action, maxActions)) {
    return { allowed: false, reason: 'Rate limit exceeded. Please try again later.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: SubscriptionStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!user) return { allowed: false, reason: 'User not found' }

  // Check credits with security buffer
  const remainingCredits = user.creditsTotal - user.creditsUsed
  if (remainingCredits < creditsRequired) {
    return { 
      allowed: false, 
      reason: 'Insufficient credits',
      creditsRequired,
      creditsRemaining: remainingCredits
    }
  }

  // Security check: prevent negative credits
  if (user.creditsUsed < 0 || user.creditsTotal < 0) {
    console.error(`Invalid credit state for user ${userId}: used=${user.creditsUsed}, total=${user.creditsTotal}`)
    return { allowed: false, reason: 'Invalid account state. Please contact support.' }
  }

  // Check feature limits for current month
  const currentMonthYear = new Date().toISOString().slice(0, 7) // "2024-01"
  const featureUsage = await prisma.featureUsage.findUnique({
    where: {
      userId_monthYear: {
        userId,
        monthYear: currentMonthYear
      }
    }
  })

  const config = getPlanConfig(user.currentPlan)

  // Check specific action limits
  switch (action) {
    case 'create_design_file':
      if (config.designFiles > 0 && (featureUsage?.designFiles || 0) >= config.designFiles) {
        return { allowed: false, reason: 'Design file limit reached for current plan' }
      }
      break
    case 'create_screen_flow':
      if (config.screenFlows > 0 && (featureUsage?.screenFlows || 0) >= config.screenFlows) {
        return { allowed: false, reason: 'Screen flow limit reached for current plan' }
      }
      break
    case 'export_figma':
    case 'export_code':
      // Additional security for export actions
      if (user.currentPlan === SubscriptionPlan.FREE) {
        return { allowed: false, reason: 'Export features require a paid plan' }
      }
      break
  }

  return { allowed: true, creditsRemaining: remainingCredits }
}

export async function consumeCredits(userId: string, creditsUsed: number, action: string, resourceId?: string) {
  // Update user credits
  await prisma.user.update({
    where: { id: userId },
    data: {
      creditsUsed: { increment: creditsUsed }
    }
  })

  // Log credit usage
  await prisma.creditUsage.create({
    data: {
      userId,
      creditsUsed,
      action,
      resourceId,
      description: `Used ${creditsUsed} credits for ${action}`
    }
  })

  // Update feature usage
  const currentMonthYear = new Date().toISOString().slice(0, 7)
  const incrementData: Record<string, number> = {}
  
  switch (action) {
    case 'create_design_file':
      incrementData.designFiles = 1
      break
    case 'create_screen_flow':
      incrementData.screenFlows = 1
      break
    case 'export_figma':
      incrementData.figmaExports = 1
      break
    case 'export_code':
      incrementData.codeExports = 1
      break
  }

  if (Object.keys(incrementData).length > 0) {
    await prisma.featureUsage.upsert({
      where: {
        userId_monthYear: {
          userId,
          monthYear: currentMonthYear
        }
      },
      update: incrementData,
      create: {
        userId,
        monthYear: currentMonthYear,
        ...incrementData
      }
    })
  }
}
