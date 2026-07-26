export type OpenCheckoutOptions = {
  checkoutOrigin?: string
  // BCP 47 tag for the checkout UI. Defaults to the payer's browser languages.
  locale?: string
  styleNonce?: string
  signal?: AbortSignal
}

export type Checkout = {
  invoiceId: string
  result: Promise<CheckoutResult>
  close: () => void
}

// Real payment or simulated test-mode one. Advisory: fulfill on the
// `invoice.paid` webhook, never on a browser result.
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
