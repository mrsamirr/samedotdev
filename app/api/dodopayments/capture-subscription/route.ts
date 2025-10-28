import { NextRequest, NextResponse } from "next/server";
import { dodopayments } from "@/lib/dodopayments";

export async function POST(request: NextRequest) {
  try {
    const { subscriptionID, planName, billingCycle } = await request.json();

    if (!subscriptionID) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

   

    try {
      // Retrieve the subscription details from DodoPayments
      const subscription = await dodopayments.subscriptions.retrieve(subscriptionID);
      
      if (!subscription) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
        );
      }

      // Log subscription details for debugging
      console.log("DodoPayments Subscription captured:", {
        subscriptionId: subscriptionID,
        planName,
        billingCycle,
        status: subscription.status,
        productId: subscription.product_id
      });

      return NextResponse.json({ 
        success: true,
        subscription: {
          id: subscriptionID,
          status: subscription.status,
          productId: subscription.product_id, // This is the planId we need
          planName,
          billingCycle
        }
      });
    } catch (dodoError) {
      console.error("DodoPayments API error:", dodoError);
      
      // If DodoPayments API fails, still allow the subscription to proceed
      // This prevents blocking users when there are temporary API issues
      console.log("Proceeding with subscription despite DodoPayments API error");
      
      return NextResponse.json({ 
        success: true,
        subscription: {
          id: subscriptionID,
          status: 'pending_verification',
          productId: 'unknown',
          planName,
          billingCycle
        },
        warning: "Subscription created but verification pending"
      });
    }
  } catch (error) {
    console.error("DodoPayments capture subscription error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to capture subscription",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}