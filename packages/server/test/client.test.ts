import { afterEach, describe, expect, it, vi } from 'vitest'
import { Invoq, InvoqApiError, InvoqError } from '../src'

const invoice = {
  id: 'inv_test_123',
  mode: 'test',
  amount: '149',
  currency: 'USD',
  reference_id: 'order_123',
  description: 'Test order',
  return_url: 'https://merchant.test/thanks',
  deposit_address: null,
  status: 'unpaid',
  amount_due: '149.000000000000000000',
  amount_overpaid: '0.000000000000000000',
  monitoring_ends_at: null,
  monitoring_status: null,
  direct_onchain_rails: [],
}

const publicInvoice = {
  id: 'inv_test_123',
  mode: 'test',
  amount: '149',
  currency: 'USD',
  description: 'Test order',
  return_url: null,
  project: {
    id: 'proj_test_123',
    name: 'Test project',
    logo_url: null,
  },
  deposit_address: null,
  status: 'unpaid',
  amount_due: '149.000000000000000000',
  amount_overpaid: '0.000000000000000000',
  monitoring_ends_at: null,
  monitoring_status: null,
  direct_onchain_rails: [],
  amount_paid: '0',
  payment_status: 'unpaid',
  transfers: [],
}

describe('@invoq/server client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates api keys, apiOrigin, and timeoutMs', () => {
    expect(() => new Invoq('')).toThrow(InvoqError)
    expect(
      () => new Invoq('sk_test_123', { apiOrigin: 'ftp://api.test' }),
    ).toThrow(InvoqError)
    expect(
      () => new Invoq('sk_test_123', { apiOrigin: 'https://api.test/api' }),
    ).toThrow(InvoqError)
    expect(
      () => new Invoq('sk_test_123', { apiOrigin: 'https://api.test/v1' }),
    ).toThrow(InvoqError)
    expect(
      () =>
        new Invoq('sk_test_123', { apiOrigin: 'https://user:pass@api.test' }),
    ).toThrow(InvoqError)
    expect(() => new Invoq('sk_test_123', { timeoutMs: 0 })).toThrow(InvoqError)
    expect(() => new Invoq('sk_test_123', { timeoutMs: Number.NaN })).toThrow(
      InvoqError,
    )
    expect(() => new Invoq('sk_test_123', { timeoutMs: 1500.5 })).toThrow(
      InvoqError,
    )
    expect(
      () => new Invoq('sk_test_123', { timeoutMs: 5_000_000_000 }),
    ).toThrow(InvoqError)
  })

  it('creates invoices with API-native JSON and authorization headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: invoice }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })
    const result = await invoq.invoices.create({
      amount: '149',
      currency: 'USD',
      description: 'Test order',
      reference_id: 'order_123',
      return_url: 'https://merchant.test/thanks',
    })

    expect(result).toEqual(invoice)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const headers = init.headers as Headers

    expect(url.toString()).toBe('https://api.test/v1/invoices')
    expect(init.method).toBe('POST')
    expect(headers.get('Authorization')).toBe('Bearer sk_test_123')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('User-Agent')).toMatch(/^invoq-node\/\d+\.\d+\.\d+/)
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(init.body as string)).toEqual({
      amount: '149',
      currency: 'USD',
      description: 'Test order',
      reference_id: 'order_123',
      return_url: 'https://merchant.test/thanks',
    })
  })

  it('maps request timeouts to InvoqError before other connection failures', async () => {
    const invoq = new Invoq('sk_test_123', { timeoutMs: 5 })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')),
    )
    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toThrow('invoq API request timed out.')

    // Node 20.0-20.7 reports mid-request timeout aborts as AbortError.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
    )
    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toThrow('invoq API request timed out.')

    // Timeout firing while the response body streams rejects response.text().
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.reject(new DOMException('timed out', 'TimeoutError')),
      } as unknown as Response),
    )
    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toThrow('invoq API request timed out.')
  })

  it('omits unset optional invoice request strings while accepting null response fields', async () => {
    const invoiceWithoutMetadata = {
      ...invoice,
      reference_id: null,
      description: null,
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: invoiceWithoutMetadata }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })
    const result = await invoq.invoices.create({
      amount: '149',
      currency: 'USD',
    })

    expect(result).toEqual(invoiceWithoutMetadata)

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(JSON.parse(init.body as string)).toEqual({
      amount: '149',
      currency: 'USD',
    })
  })

  it('rejects invalid request strings before fetch, as rejections', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })

    // .rejects requires each call to return a promise instead of throwing
    // synchronously, which is the documented contract.
    await expect(
      invoq.invoices.create({
        amount: '149',
        description: null as unknown as string,
      }),
    ).rejects.toThrow(InvoqError)
    await expect(
      invoq.invoices.create({
        amount: '149',
        reference_id: null as unknown as string,
      }),
    ).rejects.toThrow(InvoqError)
    await expect(
      invoq.invoices.create({
        amount: '149',
        return_url: 42 as unknown as string,
      }),
    ).rejects.toThrow('return_url must be a string or null when provided.')
    await expect(invoq.invoices.create({ amount: '' })).rejects.toThrow(
      'amount must be a non-empty string.',
    )
    await expect(invoq.invoices.create({ amount: '  ' })).rejects.toThrow(
      'amount must be a non-empty string.',
    )
    await expect(
      invoq.invoices.create({ amount: 149 as unknown as string }),
    ).rejects.toThrow(InvoqError)
    await expect(invoq.invoices.get('')).rejects.toThrow(
      'invoiceId must be a non-empty string.',
    )
    await expect(invoq.invoices.get('  ')).rejects.toThrow(
      'invoiceId must be a non-empty string.',
    )
    await expect(
      invoq.invoices.createTestPayment('', { amount: '1' }),
    ).rejects.toThrow('invoiceId must be a non-empty string.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('gets invoices by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: publicInvoice }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })
    const result = await invoq.invoices.get('inv_test_123')

    expect(result).toEqual(publicInvoice)
    expect('reference_id' in result).toBe(false)
    expect(result.project.name).toBe('Test project')
    expect(result.project.logo_url).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const headers = init.headers as Headers

    expect(url.toString()).toBe('https://api.test/v1/invoices/inv_test_123')
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(headers.get('Authorization')).toBe('Bearer sk_test_123')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBeNull()
  })

  it('creates test payments and returns only the data envelope', async () => {
    const paidInvoice = {
      ...invoice,
      status: 'paid',
      amount_paid: '149',
      amount_due: '0.000000000000000000',
      fully_paid_at: '2026-06-15T00:00:00.000Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: paidInvoice,
          meta: { result: 'created' },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })
    const result = await invoq.invoices.createTestPayment('inv_test_123', {
      amount: '149',
      reference_id: 'test_payment_001',
    })

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(result).toEqual(paidInvoice)
    expect(url.toString()).toBe(
      'https://api.test/v1/invoices/inv_test_123/test-payments',
    )
    expect(JSON.parse(init.body as string)).toEqual({
      amount: '149',
      reference_id: 'test_payment_001',
    })
  })

  it('omits unset optional test payment request strings', async () => {
    const paidInvoice = {
      ...invoice,
      status: 'paid',
      amount_paid: '149',
      amount_due: '0.000000000000000000',
      fully_paid_at: '2026-06-15T00:00:00.000Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: paidInvoice }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })
    await invoq.invoices.createTestPayment('inv_test_123', {
      amount: '149',
    })

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(JSON.parse(init.body as string)).toEqual({
      amount: '149',
    })
  })

  it('rejects null test payment optional request strings before fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123', {
      apiOrigin: 'https://api.test',
    })

    await expect(
      invoq.invoices.createTestPayment('inv_test_123', {
        amount: '149',
        reference_id: null as unknown as string,
      }),
    ).rejects.toThrow(InvoqError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps API error envelopes to InvoqApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'invalid_request',
          message: 'Invalid request.',
          fields: [
            {
              location: 'body',
              field: 'amount',
              code: 'required',
              message: 'Required.',
            },
          ],
          meta: { request_id: 'req_test' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const invoq = new Invoq('sk_test_123')

    await expect(
      invoq.invoices.create({ amount: '0.001', currency: 'USD' }),
    ).rejects.toMatchObject({
      name: 'InvoqApiError',
      status: 400,
      code: 'invalid_request',
      fields: [
        {
          location: 'body',
          field: 'amount',
          code: 'required',
          message: 'Required.',
        },
      ],
      meta: { request_id: 'req_test' },
    } satisfies Partial<InvoqApiError>)
  })

  it('maps non-JSON HTTP errors to InvoqApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>bad gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    const invoq = new Invoq('sk_test_123')

    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toMatchObject({
      name: 'InvoqApiError',
      status: 502,
      payload: '<html>bad gateway</html>',
    } satisfies Partial<InvoqApiError>)
  })

  it('maps network and response parse failures to InvoqError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('boom')))

    const invoq = new Invoq('sk_test_123')

    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toBeInstanceOf(InvoqError)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not json', { status: 200 })),
    )

    await expect(
      invoq.invoices.create({ amount: '1', currency: 'USD' }),
    ).rejects.toBeInstanceOf(InvoqError)
  })
})
