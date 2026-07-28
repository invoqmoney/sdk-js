export type InvoiceMode = 'test' | 'live'
export type InvoiceCurrency = 'USD'

// Accounting status. paid/settling/settled all mean the buyer paid and differ
// only in how far the funds have moved; review_required is not a paid state.
export type InvoiceStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'settling'
  | 'settled'
  | 'review_required'

export type InvoicePaidStatus = 'paid' | 'settling' | 'settled'

// Payer-facing state, derived on every response: paid → confirming (evidence
// on chain, unconfirmed) → expired (past monitoring_ends_at) → open (an option
// is ready) → unavailable. Never authorizes fulfillment.
export type CheckoutStatus =
  'paid' | 'confirming' | 'expired' | 'open' | 'unavailable'

export type ChainNamespace = 'eip155' | 'solana' | 'tron'

export type PaymentOptionCollectionMethod = 'evm_deposit' | 'direct_exact'
export type PaymentOptionStatus = 'ready' | 'unavailable'

// Identity is (chain_namespace, chain_reference, token_address) — never array
// position, never the label/symbol/logo fields, which are display metadata.
type PaymentOptionCommon = {
  collection_method: PaymentOptionCollectionMethod
  chain_namespace: ChainNamespace
  chain_reference: string
  currency: InvoiceCurrency
  token_address: string
  token_decimals: number
  network_label: string
  display_symbol: string
  logo_url: string | null
  chain_logo_url: string | null
  status: PaymentOptionStatus
}

// One way to pay, fixed at invoice creation; later config never rewrites it.
// Only `status` is re-evaluated per response, and only 'ready' pays.
export type PaymentOption = PaymentOptionCommon &
  (
    | {
        status: 'unavailable'
      }
    | {
        collection_method: 'evm_deposit'
        status: 'ready'
        // Address owned by this invoice alone; any on-time transfer credits it.
        deposit_address: string
        // Guidance, not a match requirement: max(0, amount_due - pending)
        // rounded up to at most 6 digits (a person retypes it) and padded back
        // to token_decimals, so it can exceed amount_due by up to 0.000001.
        suggested_amount: string
      }
    | {
        collection_method: 'direct_exact'
        status: 'ready'
        // The merchant's own address. The buyer must send exactly
        // `exact_amount` (invoice_amount + matching_increment) in one transfer;
        // the increment attributes the payment and is never invoice credit.
        // All three carry exactly token_decimals fractional digits.
        recipient_address: string
        invoice_amount: string
        matching_increment: string
        exact_amount: string
      }
  )

export type Invoice = {
  id: string
  mode: InvoiceMode
  amount: string
  currency: InvoiceCurrency
  reference_id: string | null
  description: string | null
  return_url: string | null
  status: InvoiceStatus
  checkout_status: CheckoutStatus
  // Increments whenever the confirmed payment set changes; settlement alone
  // does not move it. Use it to discard a snapshot older than one you hold.
  payment_revision: number
  // max(amount - amount_paid, 0) and max(amount_paid - amount, 0), both at the
  // 18-decimal scale of amount_paid. Read these instead of subtracting money.
  amount_due: string
  amount_overpaid: string
  // One day after creation, and the only payment window. null in test mode.
  monitoring_ends_at: string | null
  // The only place payment instructions live. [] in test mode.
  payment_options: PaymentOption[]
}

export type TestPaymentInvoice = Invoice & {
  amount_paid: string
  fully_paid_at: string | null
}

export type PublicInvoiceProject = {
  id: string
  name: string | null
  logo_url: string | null
}

// One confirmed transfer credited to the invoice. `amount` is invoice currency
// at the scale of amount_paid, excluding a direct_exact matching increment.
// `transaction_id` is not unique alone — one transaction can carry several
// credits, which `event_index` separates.
export type PublicInvoiceTransfer = {
  chain_namespace: ChainNamespace
  chain_reference: string
  transaction_id: string
  event_index: number
  amount: string
  explorer_transaction_url: string | null
}

export type PublicInvoice = Omit<Invoice, 'reference_id'> & {
  project: PublicInvoiceProject
  amount_paid: string
  // Confirmed receipts, at most the 20 largest, largest first. [] in test mode.
  transfers: PublicInvoiceTransfer[]
}

// Currency (always USD) and mode (from the key) are not request fields, and
// the API rejects unknown body keys.
export type CreateInvoiceInput = {
  amount: string
  description?: string
  reference_id?: string
  return_url?: string | null
}

export type CreateTestPaymentInput = {
  amount: string
  reference_id?: string
}

export type WebhookEventType = 'invoice.paid' | 'invoice.payment_reversed'

// Payment instructions and return_url are absent by design: reconcile by
// invoice id plus reference_id.
type InvoiceLifecycleEventInvoice = {
  id: string
  mode: InvoiceMode
  status: InvoiceStatus
  amount: string
  currency: InvoiceCurrency
  amount_paid: string
  reference_id: string | null
  payment_revision: number
  fully_paid_at: string | null
}

type InvoiceLifecycleEvent<
  TType extends WebhookEventType,
  TInvoice extends InvoiceLifecycleEventInvoice,
> = {
  id: string
  type: TType
  mode: InvoiceMode
  created_at: string
  data: {
    invoice: TInvoice
  }
}

export type InvoicePaidEvent = InvoiceLifecycleEvent<
  'invoice.paid',
  InvoiceLifecycleEventInvoice & { status: InvoicePaidStatus }
>

// A paid invoice dropped back below its amount — a reorg removing a credited
// transfer, say. Carries a higher payment_revision and fully_paid_at: null.
export type InvoicePaymentReversedEvent = InvoiceLifecycleEvent<
  'invoice.payment_reversed',
  InvoiceLifecycleEventInvoice
>

export type InvoqWebhookEvent =
  | InvoicePaidEvent
  | InvoicePaymentReversedEvent
  | {
      type: string
      [key: string]: unknown
    }

export type WebhookRawBody = string | Uint8Array
