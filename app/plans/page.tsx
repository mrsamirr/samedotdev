"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";
const Navbar = dynamic(() => import("@/components/Navbar").then(m => m.Navbar), { ssr: false });
const FAQSection = dynamic(() => import("@/components/faq-section").then(m => m.FAQSection), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer").then(m => m.Footer), { ssr: false });
const DodoPaymentsButton = dynamic(() => import("@/components/DodoPaymentsButton"), { ssr: false });

const DODOPAYMENTS_PLAN_IDS = {
  standard_monthly:
    process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_MONTHLY || "",
  standard_yearly:
    process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_YEARLY || "",
  pro_monthly: process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_MONTHLY || "",
  pro_yearly: process.env.NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_YEARLY || "",
};

type DodoPaymentsPlanIds = { monthly: string; yearly: string };

type PricingPlan = {
  name: "Free" | "Standard" | "Pro";
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: string;
  creditsDetail: string;
  features: string[];
  buttonText: string;
  buttonVariant: "secondary" | "default";
  popular?: boolean;
  betterValue?: boolean;
  isActive?: boolean;
  dodopaymentsPlanId?: DodoPaymentsPlanIds | null;
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: "90 credits",
    creditsDetail: "up to 15 screens",
    features: ["HiFi UI", "Wireframe", "Design Review", "Predictive Heatmap"],
    buttonText: "Active Plan",
    buttonVariant: "secondary",
    popular: false,
    isActive: true,
    dodopaymentsPlanId: null,
  },
  {
    name: "Standard",
    description: "Best for regular use",
    monthlyPrice: 24.99,
    yearlyPrice: 149,
    credits: "420 credits",
    creditsDetail: "up to 70 screens",
    features: [
      "HiFi UI",
      "Wireframe",
      "Design Review",
      "Predictive Heatmap",
      "Export to Figma",
      "Export code",
      "Design Files (max. 5)",
      "Screen Flows (max. 5 screens)",
    ],
    buttonText: "Subscribe",
    buttonVariant: "default",
    popular: true,
    betterValue: true,
    dodopaymentsPlanId: {
      monthly: DODOPAYMENTS_PLAN_IDS.standard_monthly,
      yearly: DODOPAYMENTS_PLAN_IDS.standard_yearly,
    },
  },
  {
    name: "Pro",
    description: "For power users",
    monthlyPrice: 14.99,
    yearlyPrice: 249,
    credits: "1200 credits",
    creditsDetail: "up to 200 screens",
    features: [
      "HiFi UI",
      "Wireframe",
      "Design Review",
      "Predictive Heatmap",
      "Export to Figma",
      "Export code",
      "Design Files (unlimited)",
      "Screen Flows (unlimited)",
    ],
    buttonText: "Subscribe",
    buttonVariant: "default",
    popular: false,
    dodopaymentsPlanId: {
      monthly: DODOPAYMENTS_PLAN_IDS.pro_monthly,
      yearly: DODOPAYMENTS_PLAN_IDS.pro_yearly,
    },
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleDodoPaymentsSuccess = async (
    data: { subscriptionId: string; planId: string },
    planName: PricingPlan["name"]
  ) => {
    try {
      // First capture the subscription
      const captureResponse = await fetch(
        "/api/dodopayments/capture-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionID: data.subscriptionId,
            planName: planName,
            billingCycle: isYearly ? "yearly" : "monthly",
          }),
        }
      );

      const captureResult = await captureResponse.json();

      if (captureResult?.success) {
        // Then create the subscription record
        const subscriptionResponse = await fetch("/api/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: data.subscriptionId,
            planId: captureResult.subscription.productId, // Use productId from capture
            planName: planName,
            billingCycle: isYearly ? "yearly" : "monthly",
          }),
        });

        const subscriptionResult = await subscriptionResponse.json();

        if (subscriptionResult?.success) {
          alert(`${planName} subscription activated successfully!`);
          // Redirect to dashboard or reload page to show updated plan
          window.location.href = "/dashboard";
        } else {
          alert(
            subscriptionResult?.error ||
              "There was an error activating your subscription. Please contact support."
          );
        }
      } else {
        alert(
          captureResult?.error ||
            "There was an error processing your subscription. Please contact support."
        );
      }
    } catch (error) {
      console.error("DodoPayments success handler error:", error);
      alert(
        "There was an error activating your subscription. Please contact support."
      );
    }
  };

  const handleDodoPaymentsError = (_error: unknown) => {
    alert("There was an error processing your payment. Please try again.");
  };

  const handleDodoPaymentsCancel = (_data: unknown) => {
    setSelectedPlan(null);
  };

  const getPlanId = (plan: PricingPlan): string | null => {
    if (!plan.dodopaymentsPlanId) return null;
    return isYearly
      ? plan.dodopaymentsPlanId.yearly
      : plan.dodopaymentsPlanId.monthly;
  };

  const isPlanAvailable = (plan: PricingPlan) => {
    const id = getPlanId(plan);
    // console.log("DodoPayments Plan ID:", getPlanId(plan));
    return !!id && id.trim().length > 0;
  };

  async function validatePlanOrAlert(plan: PricingPlan) {
    const planId = getPlanId(plan);
    if (!planId) {
      alert("DodoPayments plan not configured for this billing period.");
      return false;
    }
    try {
      const res = await fetch("/api/dodopayments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          data?.error || "Invalid DodoPayments plan. Please contact support."
        );
        return false;
      }
      return true;
    } catch (e) {
      alert(
        e || "Network error validating DodoPayments plan. Please try again."
      );
      return false;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div
        className="py-16 px-4"
        style={{
          background:
            "linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #8b5cf6 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance"
              style={{ color: "#ffffff" }}
            >
              AI + UX: Do more in less time
            </h1>
            <p
              className="text-xl text-white mb-8 text-pretty"
              style={{ color: "#ffffff" }}
            >
              Get the early-bird pricing:
            </p>

            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1 mb-12">
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  isYearly
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-purple-900 hover:text-purple-800"
                }`}
              >
                Yearly
                 
              </button>
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  !isYearly
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-purple-900 hover:text-purple-800"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className="relative bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {plan.betterValue && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                   
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-gray-500 text-sm">/mo</span>
                    )}
                    {plan.yearlyPrice === 0 && (
                      <span className="text-gray-500 text-sm"> (forever)</span>
                    )}
                  </div>

                  {/* Show regular button or DodoPayments button based on plan */}
                  {plan.isActive ? (
                    <Button
                      variant="secondary"
                      size="default"
                      className="w-full mb-4 bg-green-100 text-green-700 hover:bg-green-200"
                      disabled
                    >
                      {plan.buttonText}
                    </Button>
                  ) : plan.dodopaymentsPlanId ? (
                    <div className="mb-4">
                      {selectedPlan === plan.name ? (
                        <div>
                          <DodoPaymentsButton
                            planId={getPlanId(plan)!}
                            onSuccess={(data) =>
                              handleDodoPaymentsSuccess(data, plan.name)
                            }
                            onError={handleDodoPaymentsError}
                            onCancel={handleDodoPaymentsCancel}
                            disabled={!isPlanAvailable(plan)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setSelectedPlan(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant={plan.buttonVariant}
                          size="default"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={async () => {
                            const ok = await validatePlanOrAlert(plan);
                            if (ok) setSelectedPlan(plan.name);
                          }}
                          disabled={!isPlanAvailable(plan)}
                        >
                          {isPlanAvailable(plan)
                            ? plan.buttonText
                            : "Unavailable"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant={plan.buttonVariant}
                      size="default"
                      className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {plan.buttonText}
                    </Button>
                  )}

                  <p className="text-xs text-gray-500">
                    {plan.dodopaymentsPlanId
                      ? isPlanAvailable(plan)
                        ? "Secure payment powered by DodoPayments"
                        : "DodoPayments plan not configured"
                      : ""}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Credits Section */}
                  <div className="border-b pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Credits</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="font-medium text-gray-900">
                        {plan.credits}
                      </span>
                      {plan.name === "Free" && (
                        <span className="text-xs text-gray-500">
                          (one time)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-4">
                      {plan.creditsDetail}
                    </p>
                  </div>

                  {/* Features Section */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                          {feature.includes("unlimited") && (
                            <Badge
                              variant="outline"
                              className="text-xs ml-auto"
                            >
                              unlimited
                            </Badge>
                          )}
                          {feature.includes("max.") && (
                            <Badge
                              variant="outline"
                              className="text-xs ml-auto"
                            >
                              {feature.includes("max. 5")
                                ? "max. 5"
                                : "max. 5 screens"}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Need more credits? */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Need more credits?
                </h3>
                <p className="text-gray-600 mb-6">
                  Purchase additional credits to extend your usage beyond your
                  plan limits.
                </p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                  onClick={() => (window.location.href = "/credits")}
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>
          </div>

         
        </div>
      </div>

      <FAQSection />
      <Footer />
    </div>
  );
}
