import { InvoqError } from './errors'
import { requestJson } from './internal/request'
import type {
  CreateInvoiceInput,
  CreateTestPaymentInput,
  Invoice,
  PublicInvoice,
  TestPaymentInvoice,
} from './types'

const DEFAULT_API_ORIGIN = 'https://api.invoq.money'
// Invoice calls sit in a buyer's checkout click path, so a hung request
// should fail fast — creates are retry-safe via reference_id. Batch or
// back-office callers can raise timeoutMs.
const DEFAULT_TIMEOUT_MS = 10_000

type Invoices = {
  create(input: CreateInvoiceInput): Promise<Invoice>
  get(invoiceId: string): Promise<PublicInvoice>
  createTestPayment(
    invoiceId: string,
    input: CreateTestPaymentInput,
  ): Promise<TestPaymentInvoice>
}

export class Invoq {
  readonly invoices: Invoices

  constructor(
    apiKey: string,
    options: { apiOrigin?: string; timeoutMs?: number } = {},
  ) {
    if (typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new InvoqError('invoq API key must be a non-empty string.')
    }

    const apiOrigin = normalizeApiOrigin(
      options.apiOrigin ?? DEFAULT_API_ORIGIN,
    )
    const timeoutMs = normalizeTimeoutMs(
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )

    const clientOptions = { apiKey, apiOrigin, timeoutMs }

    // Methods are async so validation errors reject instead of throwing
    // synchronously, matching the documented "all methods reject" contract.
    this.invoices = {
      async create(input) {
        return requestJson<Invoice>(clientOptions, {
          path: '/v1/invoices',
          body: createInvoiceRequestBody(input),
        })
      },

      async get(invoiceId) {
        const id = requiredRequestString(invoiceId, 'invoiceId')

        return requestJson<PublicInvoice>(clientOptions, {
          method: 'GET',
          path: `/v1/invoices/${encodeURIComponent(id)}`,
        })
      },

      async createTestPayment(invoiceId, input) {
        const id = requiredRequestString(invoiceId, 'invoiceId')

        return requestJson<TestPaymentInvoice>(clientOptions, {
          path: `/v1/invoices/${encodeURIComponent(id)}/test-payments`,
          body: createTestPaymentRequestBody(input),
        })
      },
    }
  }
}

function createInvoiceRequestBody(
  input: CreateInvoiceInput,
): CreateInvoiceInput {
  const body: CreateInvoiceInput = {
    amount: requiredRequestString(input.amount, 'amount'),
  }

  if (input.currency !== undefined) {
    body.currency = input.currency
  }

  const description = optionalRequestString(input.description, 'description')
  const referenceId = optionalRequestString(input.reference_id, 'reference_id')
  const returnUrl = optionalNullableRequestString(
    input.return_url,
    'return_url',
  )

  if (description !== undefined) {
    body.description = description
  }

  if (referenceId !== undefined) {
    body.reference_id = referenceId
  }

  if (returnUrl !== undefined) {
    body.return_url = returnUrl
  }

  return body
}

function createTestPaymentRequestBody(
  input: CreateTestPaymentInput,
): CreateTestPaymentInput {
  const body: CreateTestPaymentInput = {
    amount: requiredRequestString(input.amount, 'amount'),
  }
  const referenceId = optionalRequestString(input.reference_id, 'reference_id')

  if (referenceId !== undefined) {
    body.reference_id = referenceId
  }

  return body
}

function optionalRequestString(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new InvoqError(`${fieldName} must be a string when provided.`)
  }

  return value
}

function optionalNullableRequestString(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value
  }

  if (typeof value !== 'string') {
    throw new InvoqError(`${fieldName} must be a string or null when provided.`)
  }

  return value
}

function requiredRequestString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvoqError(`${fieldName} must be a non-empty string.`)
  }

  return value
}

// AbortSignal.timeout() rejects non-integer delays and delays above the
// uint32 maximum, so catch those at construction time.
function normalizeTimeoutMs(value: number): number {
  if (!Number.isInteger(value) || value <= 0 || value > 4_294_967_295) {
    throw new InvoqError(
      'timeoutMs must be a positive integer of at most 4294967295.',
    )
  }

  return value
}

// Keep in sync with normalizeCheckoutOrigin in
// packages/checkout/src/internal/embed-url.ts.
function normalizeApiOrigin(value: string): string {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new InvoqError('apiOrigin must be an absolute http or https origin.')
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password
  ) {
    throw new InvoqError('apiOrigin must be an absolute http or https origin.')
  }

  if (url.search || url.hash) {
    throw new InvoqError('apiOrigin must not include query or hash parts.')
  }

  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  if (pathname !== '/') {
    throw new InvoqError('apiOrigin must not include a path.')
  }

  url.pathname = '/'
  url.search = ''
  url.hash = ''

  return url.toString()
}
