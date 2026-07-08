import { InvoqSignatureVerificationError } from './errors'
import {
  constantTimeEqual,
  hmacSha256Hex,
  hmacSha256HexFromBytes,
} from './internal/hmac'
import { isRecord } from './internal/parse'
import type {
  InvoiceMode,
  InvoicePaidEvent,
  InvoicePaidStatus,
  InvoqWebhookEvent,
  WebhookRawBody,
} from './types'

const DEFAULT_TOLERANCE_SECONDS = 300
const signaturePattern = /^[a-f0-9]{64}$/i
const textDecoder = new TextDecoder()
export type WebhookHeaders =
  Headers | Record<string, string | string[] | undefined> | null | undefined

export function verifyWebhook(
  rawBody: WebhookRawBody,
  headers: WebhookHeaders,
  webhookSecret: string,
): InvoqWebhookEvent {
  const signatureHeader = getSignatureHeader(headers)

  if (!signatureHeader) {
    throw signatureError('missing_signature', 'Missing invoq-signature header.')
  }

  if (typeof webhookSecret !== 'string' || webhookSecret.length === 0) {
    throw signatureError(
      'invalid_signature_header',
      'Webhook secret must be a non-empty string.',
    )
  }

  const parsed = parseSignatureHeader(signatureHeader)
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (
    Math.abs(nowSeconds - parsed.timestampSeconds) > DEFAULT_TOLERANCE_SECONDS
  ) {
    throw signatureError(
      'timestamp_outside_tolerance',
      'Webhook timestamp is outside the allowed tolerance.',
    )
  }

  const expectedSignature =
    typeof rawBody === 'string'
      ? hmacSha256Hex(webhookSecret, `${parsed.timestamp}.${rawBody}`)
      : hmacSha256HexFromBytes(webhookSecret, parsed.timestamp, rawBody)

  if (!constantTimeEqual(expectedSignature, parsed.signature)) {
    throw signatureError('signature_mismatch', 'Webhook signature mismatch.')
  }

  const bodyText =
    typeof rawBody === 'string' ? rawBody : textDecoder.decode(rawBody)

  let payload: unknown

  try {
    payload = JSON.parse(bodyText)
  } catch {
    throw signatureError(
      'invalid_payload',
      'Webhook payload is not valid JSON.',
    )
  }

  if (!isRecord(payload) || typeof payload.type !== 'string') {
    throw signatureError(
      'invalid_payload',
      'Webhook payload must be an object with a string type.',
    )
  }

  return payload as InvoqWebhookEvent
}

export function isInvoicePaid(
  event: InvoqWebhookEvent,
): event is InvoicePaidEvent {
  if (
    !isRecord(event) ||
    event.type !== 'invoice.paid' ||
    typeof event.id !== 'string' ||
    !isInvoiceMode(event.mode) ||
    typeof event.created_at !== 'string' ||
    !isRecord(event.data) ||
    !isRecord(event.data.invoice)
  ) {
    return false
  }

  const invoice = event.data.invoice

  return (
    typeof invoice.id === 'string' &&
    isInvoiceMode(invoice.mode) &&
    isInvoicePaidStatus(invoice.status) &&
    typeof invoice.amount === 'string' &&
    invoice.currency === 'USD' &&
    typeof invoice.amount_paid === 'string' &&
    (typeof invoice.reference_id === 'string' ||
      invoice.reference_id === null) &&
    (typeof invoice.fully_paid_at === 'string' ||
      invoice.fully_paid_at === null)
  )
}

function parseSignatureHeader(signatureHeader: string): {
  timestamp: string
  timestampSeconds: number
  signature: string
} {
  const parts = new Map<string, string>()

  for (const part of signatureHeader.split(',')) {
    const separatorIndex = part.indexOf('=')

    if (separatorIndex === -1) {
      throw signatureError(
        'invalid_signature_header',
        'Invalid invoq-signature header.',
      )
    }

    const key = part.slice(0, separatorIndex).trim()
    const value = part.slice(separatorIndex + 1).trim()

    if (key && value) {
      parts.set(key, value)
    }
  }

  const timestamp = parts.get('t')
  const signature = parts.get('v1')

  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) {
    throw signatureError(
      'invalid_signature_header',
      'Invalid invoq-signature header.',
    )
  }

  if (!signaturePattern.test(signature)) {
    throw signatureError(
      'invalid_signature_header',
      'Invalid invoq-signature signature.',
    )
  }

  return {
    timestamp,
    timestampSeconds: Number(timestamp),
    signature: signature.toLowerCase(),
  }
}

function getSignatureHeader(headers: WebhookHeaders): string | undefined {
  if (!headers) {
    return undefined
  }

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get('invoq-signature') ?? undefined
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'invoq-signature') {
      return Array.isArray(value) ? value.join(',') : value
    }
  }

  return undefined
}

function isInvoiceMode(value: unknown): value is InvoiceMode {
  return value === 'test' || value === 'live'
}

function isInvoicePaidStatus(value: unknown): value is InvoicePaidStatus {
  return value === 'paid' || value === 'settling' || value === 'settled'
}

function signatureError(
  code: InvoqSignatureVerificationError['code'],
  message: string,
): InvoqSignatureVerificationError {
  return new InvoqSignatureVerificationError(code, message)
}
