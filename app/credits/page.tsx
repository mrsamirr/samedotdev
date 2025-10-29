"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
const Navbar = dynamic(() => import("@/components/Navbar").then(m => m.Navbar), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer").then(m => m.Footer), { ssr: false });
import { Coins } from "lucide-react";

// DodoPayments credit packs - matching the plans page
const CREDIT_PACKS: { credits: number; price: number; productId: string }[] = [
  {
    credits: 360,
    price: 4.0,
    productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_360 || "",
  },
  {
    credits: 720,
    price: 8.0,
    productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_720 || "",
  },
  {
    credits: 1440,
    price: 16.0,
    productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_1440 || "",
  },
  {
    credits: 2880,
    price: 32.0,
    productId: process.env.NEXT_PUBLIC_DODO_CREDIT_PACK_2880 || "",
  },
];

export default function CreditsPage() {
  const [buying, setBuying] = useState<string | null>(null);

  const buyCreditsWithDodo = async (productId: string, amount: number) => {
    try {
      setBuying(String(amount));
      console.log("Buy credits clicked:", { productId, amount });

      if (!productId) {
        alert(
          "Credit pack is not configured. Please set NEXT_PUBLIC_DODO_CREDIT_PACK_* env vars."
        );
        return;
      }

      console.log("Making request to /api/dodopayments/create-credit-pack");

      const requestBody = {
        productId,
        returnUrl: `${window.location.origin}/credits`,
        cancelUrl: `${window.location.origin}/credits`,
      };

      console.log("Request body:", requestBody);

      const res = await fetch("/api/dodopayments/create-credit-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      const data = await res.json();
      console.log("Credit pack response:", data);

      if (!res.ok) {
        alert(
          `Error: ${data?.error || "Failed to create payment link"}\nDetails: ${
            data?.details || "No details"
          }`
        );
      } else if (!data?.url) {
        alert("No payment URL returned from server");
      } else {
        console.log("Redirecting to:", data.url);
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Credit pack error:", e);
      alert(
        `Network error: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    } finally {
      setBuying(null);
    }
  };

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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
              Buy Credits
            </h1>
            <p className="text-xl text-white mb-8 text-pretty">
              Purchase additional credits to power your AI design workflow
            </p>
          </div>

          {/* Credit Packs */}
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
            {CREDIT_PACKS.map((pack) => (
              <Card
                key={pack.credits}
                className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Coins className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {pack.credits}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Credits</div>
                  <div className="text-xl font-bold text-purple-600 mb-4">
                    ${pack.price}
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={
                      buying === String(pack.credits) || !pack.productId
                    }
                    onClick={() =>
                      buyCreditsWithDodo(pack.productId, pack.credits)
                    }
                  >
                    {buying === String(pack.credits)
                      ? "Processing..."
                      : !pack.productId
                      ? "Not Configured"
                      : "Buy"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">
                      What can you do with credits?
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>Generate AI-powered UI designs</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>Create wireframes and mockups</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>Export to Figma and code</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>Generate design reviews</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Credit Usage</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• 1 screen generation = ~6 credits</li>
                      <li>• Wireframe = ~3 credits</li>
                      <li>• Design review = ~2 credits</li>
                      <li>• Export to Figma = ~1 credit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
