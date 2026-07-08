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
  monitoring_ends_at: string | null
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

export type PublicInvoice = Omit<Invoice, 'reference_id'> & {
  amount_paid: string
  payment_status: InvoicePaymentStatus
  project: PublicInvoiceProject
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
