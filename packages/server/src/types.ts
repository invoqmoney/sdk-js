export type InvoiceMode = 'test' | 'live'
export type InvoiceCurrency = 'USD'

export type InvoiceStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'settling'
  | 'settled'
  | 'review_required'

export type InvoicePaymentStatus = InvoiceStatus | 'confirming'
export type InvoicePaidStatus = 'paid' | 'settling' | 'settled'

// Server-computed state of the invoice's deposit-address monitoring window.
// 'ended' means the address is no longer watched. null for test invoices.
export type MonitoringStatus = 'active' | 'ended'

export type DirectOnchainRail = {
  chain_namespace: string
  chain_reference: string
  token_address: string
  network_label: string
  display_symbol: string
  logo_url: string | null
  chain_logo_url: string | null
  network_fee_usd: string
  eta_seconds: number
}

export type Invoice = {
  id: string
  mode: InvoiceMode
  amount: string
  currency: InvoiceCurrency
  reference_id: string | null
  description: string | null
  return_url: string | null
  deposit_address: string | null
  status: InvoiceStatus
  amount_due: string
  // Excess received beyond the invoiced amount — max(amount_paid - amount, 0),
  // same 18-decimal scale as amount_paid.
  amount_overpaid: string
  monitoring_ends_at: string | null
  monitoring_status: MonitoringStatus | null
  direct_onchain_rails: DirectOnchainRail[]
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

// One confirmed inbound transfer credited to the invoice — the payer-facing
// receipt trail. `amount` is in invoice-currency units at the same scale as
// amount_paid; `explorer_tx_url` is null when the chain has no usable explorer.
export type PublicInvoiceTransfer = {
  tx_hash: string
  amount: string
  explorer_tx_url: string | null
}

export type PublicInvoice = Omit<Invoice, 'reference_id'> & {
  amount_paid: string
  payment_status: InvoicePaymentStatus
  project: PublicInvoiceProject
  // Confirmed on-chain receipts (see PublicInvoiceTransfer); [] for test
  // invoices.
  transfers: PublicInvoiceTransfer[]
}

export type CreateInvoiceInput = {
  amount: string
  currency?: InvoiceCurrency
  description?: string
  reference_id?: string
  return_url?: string | null
}

export type CreateTestPaymentInput = {
  amount: string
  reference_id?: string
}

export type InvoicePaidEvent = {
  id: string
  type: 'invoice.paid'
  mode: InvoiceMode
  created_at: string
  data: {
    invoice: {
      id: string
      mode: InvoiceMode
      status: InvoicePaidStatus
      amount: string
      currency: InvoiceCurrency
      amount_paid: string
      reference_id: string | null
      fully_paid_at: string | null
    }
  }
}

export type InvoqWebhookEvent =
  | InvoicePaidEvent
  | {
      type: string
      [key: string]: unknown
    }

export type WebhookRawBody = string | Uint8Array
