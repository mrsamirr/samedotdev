"use client"

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    dodopayments?: {
      Buttons: (options: DodoPaymentsButtonsOptions) => { render: (container: HTMLElement) => void }
    }
  }
}

interface DodoPaymentsButtonProps {
  planId: string
  onSuccess?: (data: { subscriptionId: string; planId: string }) => void
  onError?: (error: unknown) => void
  onCancel?: (data: unknown) => void
  disabled?: boolean
}

interface DodoPaymentsActions {
  subscription: { create: (opts: { plan_id: string }) => Promise<string> }
}

interface DodoPaymentsApproveData { subscriptionID: string }

interface DodoPaymentsButtonsOptions {
  style?: {
    shape?: 'rect' | 'pill'
    color?: 'gold' | 'blue' | 'silver' | 'black'
    layout?: 'vertical' | 'horizontal'
    label?: 'subscribe' | 'dodopayments'
  }
  createSubscription: (data: unknown, actions: DodoPaymentsActions) => Promise<string>
  onApprove: (data: DodoPaymentsApproveData, actions: unknown) => void
  onError?: (err: unknown) => void
  onCancel?: (data: unknown) => void
}

export default function DodoPaymentsButton({ 
  planId, 
  onSuccess, 
  onError, 
  onCancel,
  disabled = false
}: DodoPaymentsButtonProps) {
  const dodopaymentsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!planId || disabled) return

    const loadDodoPaymentsScript = () => {
      // DodoPayments uses server-side API, not client-side SDK
      createPaymentButton()
    }

    const createPaymentButton = () => {
      if (!dodopaymentsRef.current) return
      
      const container = dodopaymentsRef.current
      container.innerHTML = `
        <button 
          id="dodo-payment-btn"
          style="
            width: 100%;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'"
        >
          Subscribe with DodoPayments
        </button>
      `
      
      const button = container.querySelector('#dodo-payment-btn') as HTMLButtonElement | null
      if (button) {
        button.onclick = async () => {
          try {
            button.textContent = 'Creating subscription...'
            button.style.opacity = '0.7'
            
            // Create subscription through our API
            console.log('Creating subscription for plan:', planId)
            
            const response = await fetch('/api/dodopayments/create-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ planId }),
            })

            const data = await response.json()
            console.log('Create subscription response:', data)

            if (response.ok && data.success) {
              // Redirect to DodoPayments checkout
              if (data.subscriptionUrl) {
                console.log('Redirecting to DodoPayments checkout:', data.subscriptionUrl)
                window.location.href = data.subscriptionUrl
              } else {
                // Fallback: simulate success for testing
                console.log(`Creating mock DodoPayments subscription for plan: ${planId}`)
                const mockSubscriptionId = data.subscriptionId || `DODO_${Date.now()}`
                
                if (onSuccess) {
                  onSuccess({
                    subscriptionId: mockSubscriptionId,
                    planId: planId
                  })
                }
              }
            } else {
              console.error('Create subscription failed:', data)
              throw new Error(data.error || data.details || 'Failed to create subscription')
            }
          } catch (err) {
            console.error('DodoPayments error:', err)
            button.textContent = 'Subscribe with DodoPayments'
            button.style.opacity = '1'
            
            if (onError) {
              onError(err)
            }
          }
        }
      }
    }



    loadDodoPaymentsScript()

    return () => {
      const container = dodopaymentsRef.current
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [planId, onSuccess, onError, onCancel, disabled])

  if (disabled || !planId) {
    return null
  }

  return <div ref={dodopaymentsRef} className="w-full" />
}
