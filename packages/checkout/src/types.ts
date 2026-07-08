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

export type CheckoutResult =
  | {
      status: 'paid'
      invoiceId: string
    }
  | {
      status: 'overpaid'
      invoiceId: string
    }
  | {
      status: 'review_required'
      invoiceId: string
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
