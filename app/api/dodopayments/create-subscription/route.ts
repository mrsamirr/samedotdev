import { NextRequest, NextResponse } from "next/server";
import { dodopayments } from "@/lib/dodopayments";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get user session for customer info
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || "customer@example.com";
    const userName = session?.user?.name || "Customer";

    // Create subscription with DodoPayments
    type SubscriptionParams = Parameters<
      typeof dodopayments.subscriptions.create
    >[0];

    const subscriptionData: SubscriptionParams = {
      billing: {
        city: "Default City",
        country: "US" as unknown as SubscriptionParams extends {
          billing: { country: infer C };
        }
          ? C
          : string,
        state: "CA",
        street: "123 Default Street",
        zipcode: "90210",
      },
      customer: {
        email: userEmail,
        name: userName,
      },
      payment_link: true,
      product_id: planId,
      quantity: 1,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/design?success=true`,
      // Some SDKs do not support cancel_url; omit if not present in type
    };

    console.log(
      "Creating DodoPayments subscription with data:",
      subscriptionData
    );
    console.log("API Key exists?", !!process.env.DODO_API_KEY_TEST);
    console.log("Creating subscription:", subscriptionData);

    const response = await dodopayments.subscriptions.create(subscriptionData);

    console.log("DodoPayments subscription created:", response);

    const resp = response as unknown as {
      id?: string;
      subscription_id?: string;
      payment_link?: string;
      status?: string;
    };
    return NextResponse.json({
      success: true,
      planId,
      subscriptionId: resp.id ?? resp.subscription_id,
      subscriptionUrl: resp.payment_link,
      status: resp.status,
    });
  } catch (error) {
    console.error("DodoPayments create subscription error:", error);

    // Return more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
