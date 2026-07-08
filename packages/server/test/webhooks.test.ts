import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  InvoqSignatureVerificationError,
  isInvoicePaid,
  verifyWebhook,
} from '../src'

const secret = 'whsec_test_123'
const timestamp = 1_710_000_000
const body =
  '{"id":"evt_test","type":"webhook.ping","data":{"project":{"id":"proj_test"}}}'
const header =
  't=1710000000,v1=eeafd628acb4e854f5fd942644490b313220dcc7906303d0c8572050ee7795ff'

describe('verifyWebhook', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('verifies backend-compatible string payload signatures', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(verifyWebhook(body, headersWith(header), secret)).toEqual({
      id: 'evt_test',
      type: 'webhook.ping',
      data: {
        project: {
          id: 'proj_test',
        },
      },
    })
  })

  it('verifies Uint8Array and Buffer payloads without stringifying bytes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1_710_000_001 * 1000))

    const bytes = hexToBytes(
      '7b226964223a226576745f6279746573222c2274797065223a22776562686f6f6b2e70696e67222c2264617461223a7b2270726f6a656374223a7b226964223a2270726f6a5f6279746573227d7d7d',
    )
    const bytesHeader =
      't=1710000001,v1=1ee237dd9e509e515eca754c3a34da3536e8c76cfc8ce1fd0a4e74d1366d20e2'

    expect(
      verifyWebhook(bytes, headersWith(bytesHeader), secret),
    ).toMatchObject({
      id: 'evt_bytes',
      type: 'webhook.ping',
    })
    expect(
      verifyWebhook(Buffer.from(bytes), headersWith(bytesHeader), secret),
    ).toMatchObject({
      id: 'evt_bytes',
      type: 'webhook.ping',
    })
  })

  it('accepts plain header objects with case-insensitive signature keys', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(
      verifyWebhook(body, { 'Invoq-Signature': header }, secret),
    ).toMatchObject({
      id: 'evt_test',
      type: 'webhook.ping',
    })
  })

  it('accepts Node-style string array header values', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(timestamp * 1000))

    expect(
      verifyWebhook(body, { 'invoq-signature': [header] }, secret),
    ).toMatchObject({
      id: 'evt_test',
      type: 'webhook.ping',
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

describe('isInvoicePaid', () => {
  it('checks the full invoice.paid shape before narrowing', () => {
    expect(
      isInvoicePaid({
        id: 'evt_paid',
        type: 'invoice.paid',
        mode: 'test',
        created_at: '2026-06-15T00:00:00.000Z',
        data: {
          invoice: {
            id: 'inv_test',
            mode: 'test',
            status: 'paid',
            amount: '149',
            currency: 'USD',
            amount_paid: '149',
            reference_id: 'order_123',
            fully_paid_at: '2026-06-15T00:00:00.000Z',
          },
        },
      }),
    ).toBe(true)

    for (const status of ['settling', 'settled'] as const) {
      expect(
        isInvoicePaid({
          id: 'evt_paid',
          type: 'invoice.paid',
          mode: 'test',
          created_at: '2026-06-15T00:00:00.000Z',
          data: {
            invoice: {
              id: 'inv_test',
              mode: 'test',
              status,
              amount: '149',
              currency: 'USD',
              amount_paid: '149',
              reference_id: 'order_123',
              fully_paid_at: '2026-06-15T00:00:00.000Z',
            },
          },
        }),
      ).toBe(true)
    }

    expect(
      isInvoicePaid({
        id: 'evt_paid',
        type: 'invoice.paid',
        mode: 'test',
        created_at: '2026-06-15T00:00:00.000Z',
        data: {
          invoice: {
            id: 'inv_test',
            mode: 'test',
            status: 'paid',
            amount: '149',
            currency: 'USD',
            reference_id: 'order_123',
            fully_paid_at: '2026-06-15T00:00:00.000Z',
          },
        },
      }),
    ).toBe(false)

    expect(
      isInvoicePaid({
        id: 'evt_paid',
        type: 'invoice.paid',
        mode: 'test',
        created_at: '2026-06-15T00:00:00.000Z',
        data: {
          invoice: {
            id: 'inv_test',
            mode: 'test',
            status: 'review_required',
            amount: '149',
            currency: 'USD',
            amount_paid: '149',
            reference_id: 'order_123',
            fully_paid_at: null,
          },
        },
      }),
    ).toBe(false)

    expect(
      isInvoicePaid({
        id: 'evt_paid',
        type: 'invoice.paid',
        mode: 'test',
        created_at: '2026-06-15T00:00:00.000Z',
        data: {
          invoice: {
            id: 'inv_test',
            mode: 'test',
            status: 'unexpected',
            amount: '149',
            currency: 'USD',
            amount_paid: '149',
            reference_id: 'order_123',
            fully_paid_at: '2026-06-15T00:00:00.000Z',
          },
        },
      }),
    ).toBe(false)
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
