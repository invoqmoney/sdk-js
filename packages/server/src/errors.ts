export class InvoqError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'InvoqError'
  }
}

export class InvoqApiError extends InvoqError {
  readonly status: number
  readonly code?: string
  readonly fields?: Array<{
    field: string
    location: 'query' | 'path' | 'body' | 'header'
    code: string
    message: string
  }>
  readonly meta?: Record<string, unknown>
  readonly payload?: unknown

  constructor(
    message: string,
    options: {
      status: number
      code?: string
      fields?: Array<{
        field: string
        location: 'query' | 'path' | 'body' | 'header'
        code: string
        message: string
      }>
      meta?: Record<string, unknown>
      payload?: unknown
    },
  ) {
    super(message)
    this.name = 'InvoqApiError'
    this.status = options.status
    this.code = options.code
    this.fields = options.fields
    this.meta = options.meta
    this.payload = options.payload
  }
}

type InvoqSignatureVerificationErrorCode =
  | 'missing_signature'
  | 'invalid_signature_header'
  | 'timestamp_outside_tolerance'
  | 'signature_mismatch'
  | 'invalid_payload'

export class InvoqSignatureVerificationError extends InvoqError {
  readonly code: InvoqSignatureVerificationErrorCode

  constructor(code: InvoqSignatureVerificationErrorCode, message: string) {
    super(message)
    this.name = 'InvoqSignatureVerificationError'
    this.code = code
  }
}
