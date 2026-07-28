import { version } from '../../package.json'
import { InvoqApiError, InvoqError } from '../errors'
import { isRecord } from './parse'

const USER_AGENT = `invoq-node/${version}`

export type RequestClientOptions = {
  apiKey: string
  apiOrigin: string
  timeoutMs: number
}

type JsonRequestOptions = {
  path: string
  method?: 'GET' | 'POST'
  body?: unknown
}

export async function requestJson<T>(
  clientOptions: RequestClientOptions,
  requestOptions: JsonRequestOptions,
): Promise<T> {
  const url = new URL(requestOptions.path, clientOptions.apiOrigin)
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: `Bearer ${clientOptions.apiKey}`,
    'User-Agent': USER_AGENT,
  })
  const method = requestOptions.method ?? 'POST'
  const body =
    requestOptions.body === undefined
      ? undefined
      : JSON.stringify(requestOptions.body)

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(clientOptions.timeoutMs),
    })
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new InvoqError('invoq API request timed out.', { cause: error })
    }

    throw new InvoqError('Failed to connect to invoq API.', { cause: error })
  }

  let responseText: string

  try {
    responseText = await response.text()
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new InvoqError('invoq API request timed out.', { cause: error })
    }

    throw new InvoqError('Failed to read invoq API response.', {
      cause: error,
    })
  }

  let payload: unknown

  try {
    payload = JSON.parse(responseText)
  } catch (error) {
    if (!response.ok) {
      throw apiErrorFromResponse(response.status, responseText)
    }

    throw new InvoqError('Failed to parse invoq API response.', {
      cause: error,
    })
  }

  if (!response.ok) {
    throw apiErrorFromResponse(response.status, payload)
  }

  const envelope = isRecord(payload) ? payload : null

  if (!envelope || !Object.prototype.hasOwnProperty.call(envelope, 'data')) {
    throw new InvoqError(
      'invoq API response did not include a data envelope.',
      {
        cause: payload,
      },
    )
  }

  // A non-object `data` is a broken envelope. Returning it defers the failure to
  // the caller's first property read, far from here.
  if (!isRecord(envelope.data)) {
    throw new InvoqError(
      'invoq API response data envelope was not an object.',
      { cause: payload },
    )
  }

  return envelope.data as T
}

// The only signal we pass is our own timeout, so any abort is one — some Node
// versions report it as AbortError when it fires mid-body.
function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  )
}

function apiErrorFromResponse(status: number, payload: unknown): InvoqApiError {
  const error = isRecord(payload) ? payload : null
  const code = typeof error?.code === 'string' ? error.code : undefined
  const message =
    typeof error?.message === 'string'
      ? error.message
      : 'invoq API request failed.'
  const fields = parseFields(error?.fields)
  const meta = isRecord(error?.meta) ? error.meta : undefined

  return new InvoqApiError(message, {
    status,
    code,
    fields,
    meta,
    payload,
  })
}

function parseFields(value: unknown): InvoqApiError['fields'] {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.flatMap((field) => {
    if (!isRecord(field)) {
      return []
    }

    // A location this version does not know is passed through, not dropped:
    // the caller is already on an error path and needs the code and message.
    // Only a structurally invalid entry — one with no field error to hand
    // back — is discarded.
    if (
      typeof field.location !== 'string' ||
      typeof field.field !== 'string' ||
      typeof field.code !== 'string' ||
      typeof field.message !== 'string'
    ) {
      return []
    }

    const apiField: NonNullable<InvoqApiError['fields']>[number] = {
      field: field.field,
      location: field.location,
      code: field.code,
      message: field.message,
    }

    return [apiField]
  })
}
