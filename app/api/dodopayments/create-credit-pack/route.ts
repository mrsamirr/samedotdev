import { NextRequest, NextResponse } from 'next/server'
import { dodopayments } from '@/lib/dodopayments'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Credit pack request body:', body)
    
    const { productId, returnUrl } = body
    if (!productId) {
      console.error('Missing productId in request')
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    console.log('Creating DodoPayments payment link for productId:', productId)

    // Create a payment link for a one-time credit pack purchase
    type CreateParams = Parameters<typeof dodopayments.payments.create>[0]

    const createParams: CreateParams = {
      customer: {
        email: session.user.email || 'customer@example.com',
        name: session.user.name || 'Customer',
      },
      billing: {
        city: 'Default City',
        country: 'US' as unknown as CreateParams extends { billing: { country: infer C } } ? C : string,
        state: 'CA',
        street: '123 Default Street',
        zipcode: '90210',
      },
      product_cart: [{ product_id: productId, quantity: 1 }],
      payment_link: true,
      return_url: returnUrl || process.env.NEXT_PUBLIC_BASE_URL,
      metadata: { type: 'credit_pack', product_id: productId },
    }

    const response = await dodopayments.payments.create(createParams)

    console.log('DodoPayments response:', response)

    return NextResponse.json({ success: true, url: response.payment_link })
  } catch (error) {
    console.error('Create credit pack link error:', error)
    return NextResponse.json({ 
      error: 'Failed to create credit pack payment link', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
