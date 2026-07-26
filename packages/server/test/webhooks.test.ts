import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  InvoqSignatureVerificationError,
  isInvoicePaid,
  isInvoicePaymentReversed,
  verifyWebhook,
} from '../src'
import type { InvoqWebhookEvent } from '../src'

const secret = 'whsec_test_123'
const timestamp = 1_710_000_000
// An event type this version does not model: verification is shape-agnostic,
// so a new backend event never fails on an older SDK.
const body =
  '{"id":"evt_test","type":"invoice.future_event","data":{"invoice":{"id":"inv_test"}}}'
const header =
  't=1710000000,v1=7882995406911f86ee0e8a85feba7e21befe10ead08701ff7ff066738ca4c28e'

describe('verifyWebhook', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('verifies backend-compatible string payload signatures', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(verifyWebhook(body, headersWith(header), secret)).toEqual({
      id: 'evt_test',
      type: 'invoice.future_event',
      data: {
        invoice: {
          id: 'inv_test',
        },
      },
    })
  })

  it('verifies Uint8Array and Buffer payloads without stringifying bytes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1_710_000_001 * 1000))

    const bytes = hexToBytes(
      '7b226964223a226576745f6279746573222c2274797065223a22696e766f6963652e6675747572655f6576656e74222c2264617461223a7b22696e766f696365223a7b226964223a22696e765f6279746573227d7d7d',
    )
    const bytesHeader =
      't=1710000001,v1=fa0fde1c5d73fe059235b19dc1d7785e1d3c695e055dfcfa8f69a1202bacee37'

    expect(
      verifyWebhook(bytes, headersWith(bytesHeader), secret),
    ).toMatchObject({
      id: 'evt_bytes',
      type: 'invoice.future_event',
    })
    expect(
      verifyWebhook(Buffer.from(bytes), headersWith(bytesHeader), secret),
    ).toMatchObject({
      id: 'evt_bytes',
      type: 'invoice.future_event',
    })
  })

  it('accepts plain header objects with case-insensitive signature keys', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(
      verifyWebhook(body, { 'Invoq-Signature': header }, secret),
    ).toMatchObject({
      id: 'evt_test',
      type: 'invoice.future_event',
    })
  })

  it('accepts Node-style string array header values', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(
      verifyWebhook(body, { 'invoq-signature': [header] }, secret),
    ).toMatchObject({
      id: 'evt_test',
      type: 'invoice.future_event',
    })
  })

  it('rejects invalid signature headers and stale timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(() => verifyWebhook(body, {}, secret)).toThrowSignatureError(
      'missing_signature',
    )
    expect(() => verifyWebhook(body, null, secret)).toThrowSignatureError(
      'missing_signature',
    )
    expect(() => verifyWebhook(body, undefined, secret)).toThrowSignatureError(
      'missing_signature',
    )
    expect(() =>
      verifyWebhook(body, headersWith('v1=abc'), secret),
    ).toThrowSignatureError('invalid_signature_header')

    vi.setSystemTime(new Date((timestamp + 301) * 1000))

    expect(() =>
      verifyWebhook(body, headersWith(header), secret),
    ).toThrowSignatureError('timestamp_outside_tolerance')
  })

  it('rejects wrong secrets, changed bodies, invalid JSON, and bad envelopes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(() =>
      verifyWebhook(body, headersWith(header), 'wrong'),
    ).toThrowSignatureError('signature_mismatch')
    expect(() =>
      verifyWebhook(
        body.replace('evt_test', 'evt_other'),
        headersWith(header),
        secret,
      ),
    ).toThrowSignatureError('signature_mismatch')

    expect(() =>
      verifyWebhook(
        'not json',
        headersWith(sign('not json', timestamp)),
        secret,
      ),
    ).toThrowSignatureError('invalid_payload')
    expect(() =>
      verifyWebhook('[]', headersWith(sign('[]', timestamp)), secret),
    ).toThrowSignatureError('invalid_payload')
    expect(() =>
      verifyWebhook(
        '{"id":"evt"}',
        headersWith(sign('{"id":"evt"}', timestamp)),
        secret,
      ),
    ).toThrowSignatureError('invalid_payload')
  })
})

// The snapshot at the moment the invoice was first fully paid.
const paidInvoice = {
  id: 'inv_test',
  mode: 'test',
  status: 'paid',
  amount: '149.0000',
  currency: 'USD',
  amount_paid: '149.000000000000000000',
  reference_id: 'order_123',
  payment_revision: 1,
  fully_paid_at: '2026-06-15T00:00:00.000Z',
}

// The same invoice after a credited transfer was reversed.
const reversedInvoice = {
  ...paidInvoice,
  status: 'partially_paid',
  amount_paid: '20.000000000000000000',
  payment_revision: 2,
  fully_paid_at: null,
}

function lifecycleEvent(type: string, invoice: Record<string, unknown>) {
  return {
    id: 'wdel_test',
    type,
    mode: 'test',
    created_at: '2026-06-15T00:00:00.000Z',
    data: { invoice },
  }
}

function withoutField(
  event: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const rest = { ...event }
  delete rest[field]

  return rest
}

// Every field the shared envelope check requires of data.invoice.
const invoiceFields = [
  'id',
  'mode',
  'status',
  'amount',
  'currency',
  'amount_paid',
  'reference_id',
  'payment_revision',
  'fully_paid_at',
]

describe('isInvoicePaid', () => {
  it('accepts every paid-equivalent status', () => {
    for (const status of ['paid', 'settling', 'settled'] as const) {
      expect(
        isInvoicePaid(
          lifecycleEvent('invoice.paid', { ...paidInvoice, status }),
        ),
      ).toBe(true)
    }
  })

  it('checks the full invoice shape before narrowing', () => {
    for (const field of invoiceFields) {
      expect(
        isInvoicePaid(
          lifecycleEvent('invoice.paid', withoutField(paidInvoice, field)),
        ),
      ).toBe(false)
    }

    expect(
      isInvoicePaid(
        lifecycleEvent('invoice.paid', {
          ...paidInvoice,
          payment_revision: '1',
        }),
      ),
    ).toBe(false)
  })

  it('rejects a mangled envelope around a valid invoice', () => {
    for (const field of ['id', 'mode', 'created_at', 'data']) {
      // Cast because stripping an envelope field is exactly what the type
      // forbids — which is the input this guard has to survive.
      const mangled = withoutField(
        lifecycleEvent('invoice.paid', paidInvoice),
        field,
      ) as InvoqWebhookEvent

      expect(isInvoicePaid(mangled)).toBe(false)
    }
  })

  it('rejects statuses that are not cleared for fulfillment', () => {
    for (const status of ['review_required', 'partially_paid', 'unexpected']) {
      expect(
        isInvoicePaid(
          lifecycleEvent('invoice.paid', { ...paidInvoice, status }),
        ),
      ).toBe(false)
    }
  })

  it('rejects a reversal, whatever it reverted the invoice to', () => {
    expect(
      isInvoicePaid(
        lifecycleEvent('invoice.payment_reversed', reversedInvoice),
      ),
    ).toBe(false)
    expect(
      isInvoicePaid(
        lifecycleEvent('invoice.payment_reversed', {
          ...reversedInvoice,
          status: 'paid',
        }),
      ),
    ).toBe(false)
  })
})

describe('isInvoicePaymentReversed', () => {
  it('accepts a reversal in any canonical status', () => {
    for (const status of [
      'unpaid',
      'partially_paid',
      'review_required',
      'paid',
      'settling',
      'settled',
    ] as const) {
      expect(
        isInvoicePaymentReversed(
          lifecycleEvent('invoice.payment_reversed', {
            ...reversedInvoice,
            status,
          }),
        ),
      ).toBe(true)
    }
  })

  it('checks the same shared invoice shape', () => {
    for (const field of invoiceFields) {
      expect(
        isInvoicePaymentReversed(
          lifecycleEvent(
            'invoice.payment_reversed',
            withoutField(reversedInvoice, field),
          ),
        ),
      ).toBe(false)
    }
  })

  // Must not fail closed like the paid guard: dropping a reversal leaves an
  // order fulfilled on a payment that no longer exists.
  it('accepts a status this version does not know', () => {
    expect(
      isInvoicePaymentReversed(
        lifecycleEvent('invoice.payment_reversed', {
          ...reversedInvoice,
          status: 'unexpected',
        }),
      ),
    ).toBe(true)
  })

  it('rejects a paid event', () => {
    expect(
      isInvoicePaymentReversed(lifecycleEvent('invoice.paid', paidInvoice)),
    ).toBe(false)
  })
})

// The documented path: verify, then branch. The reads after each guard only
// compile once the event has narrowed.
describe('verify then narrow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('carries a signed lifecycle event through to its typed fields', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    const paidBody = JSON.stringify(lifecycleEvent('invoice.paid', paidInvoice))
    const paid = verifyWebhook(
      paidBody,
      headersWith(sign(paidBody, timestamp)),
      secret,
    )

    if (!isInvoicePaid(paid)) {
      throw new Error('expected an invoice.paid event')
    }

    expect(paid.data.invoice.reference_id).toBe('order_123')
    expect(paid.data.invoice.payment_revision).toBe(1)

    const reversedBody = JSON.stringify(
      lifecycleEvent('invoice.payment_reversed', reversedInvoice),
    )
    const reversed = verifyWebhook(
      reversedBody,
      headersWith(sign(reversedBody, timestamp)),
      secret,
    )

    expect(isInvoicePaid(reversed)).toBe(false)

    if (!isInvoicePaymentReversed(reversed)) {
      throw new Error('expected an invoice.payment_reversed event')
    }

    expect(reversed.data.invoice.payment_revision).toBe(2)
    expect(reversed.data.invoice.fully_paid_at).toBeNull()
  })
})

expect.extend({
  toThrowSignatureError(
    received: () => unknown,
    code: InvoqSignatureVerificationError['code'],
  ) {
    try {
      received()
      return {
        pass: false,
        message: () => `expected function to throw ${code}`,
      }
    } catch (error) {
      const pass =
        error instanceof InvoqSignatureVerificationError && error.code === code

      return {
        pass,
        message: () => `expected signature error code ${code}`,
      }
    }
  },
})

function sign(payload: string, unixTimestamp: number) {
  return `t=${unixTimestamp},v1=${createHmac('sha256', secret)
    .update(`${unixTimestamp}.${payload}`, 'utf8')
    .digest('hex')}`
}

function headersWith(signature: string): Headers {
  return new Headers({
    'invoq-signature': signature,
  })
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)

  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }

  return bytes
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toThrowSignatureError(code: InvoqSignatureVerificationError['code']): T
  }
}

// Compile-time contract: an unguarded event exposes no typed invoice, and each
// guard narrows to exactly its own event.
function webhookNarrowing(event: InvoqWebhookEvent) {
  // @ts-expect-error the unmodelled-event member carries no typed data
  void event.data.invoice.id

  if (isInvoicePaid(event)) {
    const invoice = event.data.invoice
    const paidStatus: 'paid' | 'settling' | 'settled' = invoice.status
    void paidStatus
    void invoice.fully_paid_at
    return
  }

  if (isInvoicePaymentReversed(event)) {
    void event.data.invoice.payment_revision
  }
}

void webhookNarrowing
