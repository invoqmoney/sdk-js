export type OpenCheckoutOptions = {
  checkoutOrigin?: string
  styleNonce?: string
  signal?: AbortSignal
}

export type Checkout = {
  invoiceId: string
  result: Promise<CheckoutResult>
  close: () => void
}

// Whether the paid invoice was a real live payment or a simulated test-mode
// one. Advisory only: it lets you branch UI in the browser, but fulfillment
// must still be confirmed server-side via the `invoice.paid` webhook.
export type CheckoutMode = 'test' | 'live'

export type CheckoutResult =
  | {
      status: 'paid'
      invoiceId: string
      mode: CheckoutMode
    }
  | {
      status: 'overpaid'
      invoiceId: string
      mode: CheckoutMode
    }
  | {
      status: 'review_required'
      invoiceId: string
      mode: CheckoutMode
    }
  | {
      status: 'closed'
      invoiceId: string
      reason: CheckoutCloseReason
    }
  | {
      status: 'failed'
      invoiceId: string
    }

export type CheckoutCloseReason =
  'user' | 'programmatic' | 'replaced' | 'aborted'
