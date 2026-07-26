const DEFAULT_CHECKOUT_ORIGIN = 'https://embed.invoq.money'

type EmbedUrlOptions = {
  invoiceId: string
  checkoutOrigin?: string
  locale?: string
}

export function buildEmbedUrl(
  options: EmbedUrlOptions,
  hostOrigin: string,
  channel: string,
) {
  validateInvoiceId(options.invoiceId)

  const embedUrl = new URL(
    `/${encodeURIComponent(options.invoiceId)}`,
    normalizeCheckoutOrigin(options.checkoutOrigin ?? DEFAULT_CHECKOUT_ORIGIN),
  )
  embedUrl.searchParams.set('embedded', '1')
  embedUrl.searchParams.set('origin', hostOrigin)
  embedUrl.searchParams.set('channel', channel)

  if (options.locale !== undefined) {
    embedUrl.searchParams.set('locale', validateLocale(options.locale))
  }

  return {
    iframeUrl: embedUrl.toString(),
    checkoutOrigin: embedUrl.origin,
  }
}

// Keep in sync with normalizeApiOrigin in
// packages/server/src/client.ts.
function normalizeCheckoutOrigin(value: string): URL {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error('checkoutOrigin must be an absolute http or https origin.')
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    (url.pathname !== '' && url.pathname !== '/') ||
    url.search ||
    url.hash
  ) {
    throw new Error('checkoutOrigin must be an absolute http or https origin.')
  }

  return new URL(url.origin)
}

function validateInvoiceId(invoiceId: string): void {
  if (typeof invoiceId !== 'string' || invoiceId.length === 0) {
    throw new Error('invoiceId must be a non-empty string.')
  }

  if (!invoiceId.startsWith('inv_')) {
    throw new Error('invoiceId must start with inv_.')
  }
}

// Tags are passed through: the checkout maps them onto the language it has and
// falls back to the payer's browser languages, so this never rejects a region.
function validateLocale(locale: string): string {
  if (typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('locale must be a non-empty string.')
  }

  return locale
}
