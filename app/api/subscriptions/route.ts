import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscription } from "@/lib/subscription";
import { SubscriptionPlan, BillingCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { subscriptionId, planId, planName, billingCycle } = await request.json();

    console.log("Subscription creation request:", { subscriptionId, planId, planName, billingCycle });

    if (!subscriptionId || !planId) {
      return NextResponse.json(
        { error: "Missing required fields: subscriptionId and planId" },
        { status: 400 }
      );
    }

    // Resolve userId robustly
    let userId = session.user.id as string | undefined
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) userId = user.id
    }
    if (!userId) {
      return NextResponse.json({ error: "Unable to resolve user account" }, { status: 400 })
    }

    // Map inputs to internal enums
    const cycle: BillingCycle = (billingCycle?.toLowerCase() === 'yearly') ? BillingCycle.YEARLY : BillingCycle.MONTHLY

    let plan: SubscriptionPlan | null = null
    if (planName?.toLowerCase() === 'standard') plan = SubscriptionPlan.STANDARD
    if (planName?.toLowerCase() === 'pro') plan = SubscriptionPlan.PRO

    if (!plan) {
      const stdMonthly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_MONTHLY
      const stdYearly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_YEARLY
      const proMonthly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_MONTHLY
      const proYearly = process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_YEARLY
      if (planId === stdMonthly || planId === stdYearly) plan = SubscriptionPlan.STANDARD
      if (planId === proMonthly || planId === proYearly) plan = SubscriptionPlan.PRO
    }

    if (!plan) {
      console.error("Plan mapping failed:", { planId, planName, billingCycle });
      return NextResponse.json({ error: "Unknown plan mapping for provided planId/planName", details: { planId, planName, billingCycle } }, { status: 400 })
    }

    console.log("Mapped plan:", { plan, cycle, userId });

    // Try to create subscription
    try {
      const subscription = await createSubscription({
        userId,
        dodopaymentsSubscriptionId: subscriptionId,
        dodopaymentsPlanId: planId,
        plan,
        billingCycle: cycle,
        amount: 0,
      })

      console.log("Subscription created:", subscription.id);

      return NextResponse.json({ 
        success: true,
        message: "Subscription created and user updated",
        subscriptionId: subscription.id
      });
    } catch (err) {
      const unknownError = err as unknown
      let code: string | number | undefined
      let message: string | undefined
      if (typeof unknownError === 'object' && unknownError !== null) {
        const maybeError = unknownError as { code?: string | number; message?: string }
        code = maybeError.code
        message = maybeError.message
      }
      console.error("createSubscription error:", code || message || unknownError)
      return NextResponse.json({ error: "DB create failed", code, message }, { status: 500 })
    }
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}