import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for individuals getting started",
    price: "$9",
    period: "month",
    features: [
      "50 AI generations per month",
      "Basic wireframe templates",
      "Standard support",
      "Export to PNG/JPG",
      "1 project workspace",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    description: "Best for growing teams and agencies",
    price: "$29",
    period: "month",
    features: [
      "500 AI generations per month",
      "Advanced design templates",
      "Priority support",
      "Export to Figma & Code",
      "10 project workspaces",
      "Team collaboration",
      "Custom brand guidelines",
      "Analytics & insights",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "$99",
    period: "month",
    features: [
      "Unlimited AI generations",
      "Custom design systems",
      "Dedicated support manager",
      "Advanced integrations",
      "Unlimited workspaces",
      "Advanced team management",
      "Custom training & onboarding",
      "SLA guarantee",
      "White-label options",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Supercharge your design workflow with AI-powered tools. Start free and scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"} transition-all duration-200 hover:shadow-md`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button variant={plan.buttonVariant} size="lg" className="w-full">
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
