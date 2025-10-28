# samedotdev

Professional AI-powered design platform for creating, managing, and iterating on UI/UX designs. Built with Next.js 15, React 19, and Anthropic's Claude AI.


## Tech Stack

- **Frontend**: Next.js 15.4.6, React 19, TypeScript, Tailwind CSS
- **Backend**: Prisma ORM, MySQL, NextAuth.js
- **AI**: Anthropic Claude API
- **Payments**: DodoPayments
- **UI**: shadcn/ui, Radix UI, Framer Motion

## Prerequisites

- Node.js 22.x
- MySQL database
- Google OAuth credentials
- Anthropic API key
- DodoPayments account

## Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/same"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# DodoPayments
DODO_API_KEY_LIVE="your-live-api-key"
DODO_API_KEY_TEST="your-test-api-key"
DODO_PAYMENTS_WEBHOOK_KEY="your-webhook-key"

# Plan IDs
NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_MONTHLY="plan-id"
NEXT_PUBLIC_DODOPAYMENTS_PLAN_STANDARD_YEARLY="plan-id"
NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_MONTHLY="plan-id"
NEXT_PUBLIC_DODOPAYMENTS_PLAN_PRO_YEARLY="plan-id"

# Credit Packs
NEXT_PUBLIC_DODO_CREDIT_PACK_360="pack-id"
NEXT_PUBLIC_DODO_CREDIT_PACK_720="pack-id"
NEXT_PUBLIC_DODO_CREDIT_PACK_1440="pack-id"
NEXT_PUBLIC_DODO_CREDIT_PACK_2880="pack-id"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Quick Start

```bash
# Install dependencies
npm install

npx prisma db push

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)



## Development Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
```




