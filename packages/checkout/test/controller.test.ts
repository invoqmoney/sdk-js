// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openCheckout } from '../src/internal/controller'
import type { Checkout } from '../src/types'

describe('@invoq/checkout controller', () => {
  let iframeSrcDescriptor: PropertyDescriptor | undefined
  let iframeSrcValues: WeakMap<HTMLIFrameElement, string>

  beforeEach(() => {
    closeOpenedCheckouts()
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
    window.history.pushState(null, '', '/checkout')
    iframeSrcDescriptor = Object.getOwnPropertyDescriptor(
      window.HTMLIFrameElement.prototype,
      'src',
    )
    iframeSrcValues = new WeakMap()
    Object.defineProperty(window.HTMLIFrameElement.prototype, 'src', {
      configurable: true,
      get() {
        return iframeSrcValues.get(this) ?? ''
      },
      set(value: string) {
        iframeSrcValues.set(this, value)
      },
    })
  })

  afterEach(() => {
    closeOpenedCheckouts()
    if (iframeSrcDescriptor) {
      Object.defineProperty(
        window.HTMLIFrameElement.prototype,
        'src',
        iframeSrcDescriptor,
      )
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('creates a shadow host and iframe with the embed URL contract', () => {
    openTestCheckout({ checkoutOrigin: 'https://embed.test' })

    const { host, iframe } = getMountedCheckout()
    const style = host.shadowRoot?.querySelector('style')
    const iframeUrl = new URL(iframe.src)

    expect(style).toBeTruthy()
    expect(style?.textContent).toContain('rgba(12, 11, 8, 0.32)')
    expect(style?.textContent).toContain('oklch(0.15 0.006 100 / 32%)')
    expect(style?.textContent).toContain('blur(8px) saturate(0.9)')
    expect(style?.textContent).toContain('prefers-reduced-motion')
    expect(host.getAttribute('role')).toBe('dialog')
    expect(host.getAttribute('aria-label')).toBe('invoq checkout')
    // aria-modal is only asserted once the embed is ready and its own focus
    // trap is live.
    expect(host.getAttribute('aria-modal')).toBeNull()
    expect(host.style.top).toBe('0px')
    expect(host.style.right).toBe('0px')
    expect(host.style.bottom).toBe('0px')
    expect(host.style.left).toBe('0px')
    expect(document.querySelector('style')).toBeNull()
    expect(iframe.title).toBe('invoq checkout')
    expect(iframe.allow).toBe('clipboard-write')
    expect(iframe.referrerPolicy).toBe('strict-origin-when-cross-origin')
    expect(iframeUrl.origin + iframeUrl.pathname).toBe(
      'https://embed.test/inv_test_123',
    )
    expect(iframeUrl.searchParams.get('embedded')).toBe('1')
    expect(iframeUrl.searchParams.get('origin')).toBe('http://localhost:3000')
    expect(iframeUrl.searchParams.get('channel')).toMatch(/^invoq_/)
    expect(iframeUrl.searchParams.has('locale')).toBe(false)
    expect(iframeUrl.searchParams.has('invoice_id')).toBe(false)
    expect(iframeUrl.searchParams.has('state')).toBe(false)
    expect(iframeUrl.searchParams.has('theme')).toBe(false)
    expect(iframeUrl.searchParams.has('id')).toBe(false)
    expect(iframeUrl.searchParams.has('invoice')).toBe(false)
    expect(iframeUrl.searchParams.has('apiOrigin')).toBe(false)
  })

  it('applies a nonce to the injected style element for strict CSP', () => {
    openTestCheckout({ styleNonce: 'test-nonce' })

    const { host } = getMountedCheckout()
    const style = host.shadowRoot?.querySelector('style')

    expect(style?.nonce).toBe('test-nonce')
  })

  it('throws invalid input without creating a host', () => {
    expect(() =>
      openCheckout('bad', {
        checkoutOrigin: 'https://embed.test',
      }),
    ).toThrow('invoiceId must start with inv_.')
    expect(document.body.firstElementChild).toBeNull()

    expect(() =>
      openCheckout('inv_test_123', {
        checkoutOrigin: '/relative',
      }),
    ).toThrow('checkoutOrigin must be an absolute http or https origin.')
    expect(document.body.firstElementChild).toBeNull()

    expect(() =>
      openCheckout('inv_test_123', {
        checkoutOrigin: 'https://embed.test/pay',
      }),
    ).toThrow('checkoutOrigin must be an absolute http or https origin.')
    expect(document.body.firstElementChild).toBeNull()
  })

  it('does not lock scroll when Shadow DOM is unsupported', () => {
    const originalAttachShadow = window.HTMLElement.prototype.attachShadow
    Object.defineProperty(window.HTMLElement.prototype, 'attachShadow', {
      configurable: true,
      value: undefined,
    })

    try {
      expect(() =>
        openCheckout('inv_test_123', {
          checkoutOrigin: 'https://embed.test',
        }),
      ).toThrow('This browser does not support invoq checkout.')
      expect(document.body.firstElementChild).toBeNull()
      expect(document.documentElement.style.overflow).toBe('')
      expect(document.body.style.overflow).toBe('')
    } finally {
      Object.defineProperty(window.HTMLElement.prototype, 'attachShadow', {
        configurable: true,
        value: originalAttachShadow,
      })
    }
  })

  it('locks and restores scroll and does not close on backdrop or spinner clicks', async () => {
    document.body.style.paddingRight = '4px'

    const checkout = openTestCheckout()
    const { backdrop, spinner } = getMountedCheckout()

    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')

    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    spinner.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.body.firstElementChild).toBeTruthy()

    checkout.close()

    expect(document.body.firstElementChild).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('4px')
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })

  it('validates postMessage source, origin, shape, and channel', async () => {
    const checkout = openTestCheckout()
    const { iframe, channel } = getMountedCheckout()

    postMessageFromIframe(iframe, 'https://evil.test', {
      type: 'invoq:state',
      channel,
      state: 'paid',
    })
    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel: 'wrong',
      state: 'paid',
    })
    postMessageFromWindow('https://embed.test', {
      type: 'invoq:state',
      channel,
      state: 'paid',
    })
    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'not-invoq',
      channel,
      state: 'paid',
    })
    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel,
      state: 'paid',
    })

    await expect(checkout.result).resolves.toEqual({
      status: 'paid',
      invoiceId: 'inv_test_123',
    })
  })

  it('handles ready, hides the spinner, and ignores embed-owned loading errors', async () => {
    vi.useFakeTimers()

    const checkout = openTestCheckout()
    const { host, iframe, spinner, channel } = getMountedCheckout()

    expect(spinner.hidden).toBe(false)

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:ready',
      channel,
    })

    expect(spinner.hidden).toBe(true)
    expect(host.getAttribute('aria-modal')).toBe('true')

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:error',
      channel,
      code: 'invoice_not_found',
    })
    vi.advanceTimersByTime(15_000)

    expect(document.body.firstElementChild).toBeTruthy()

    checkout.close()
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })

  it('tears down and resolves a failed result on ready timeout', async () => {
    vi.useFakeTimers()
    const checkout = openTestCheckout()

    vi.advanceTimersByTime(15_000)

    expect(document.body.firstElementChild).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    await expect(checkout.result).resolves.toEqual({
      status: 'failed',
      invoiceId: 'inv_test_123',
    })
  })

  it('closes with user reason on Escape, including while loading', async () => {
    const checkout = openTestCheckout()

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    )

    expect(document.body.firstElementChild).toBeNull()
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'user',
    })

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    )
  })

  it('ignores Escape pressed during IME composition', async () => {
    const checkout = openTestCheckout()

    const composingEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
    })
    Object.defineProperty(composingEscape, 'isComposing', { value: true })
    window.dispatchEvent(composingEscape)

    expect(document.body.firstElementChild).toBeTruthy()

    checkout.close()
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })

  it('treats any verified embed message as ready so the timeout never fires after paid', async () => {
    vi.useFakeTimers()

    const checkout = openTestCheckout()
    const { host, iframe, spinner, channel } = getMountedCheckout()

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel,
      state: 'paid',
    })

    expect(spinner.hidden).toBe(true)
    expect(host.getAttribute('aria-modal')).toBe('true')

    vi.advanceTimersByTime(15_000)

    expect(document.body.firstElementChild).toBeTruthy()
    await expect(checkout.result).resolves.toEqual({
      status: 'paid',
      invoiceId: 'inv_test_123',
    })

    checkout.close()
  })

  it('resolves paid and overpaid results once per checkout instance', async () => {
    const first = openTestCheckout()
    const firstMounted = getMountedCheckout()

    postMessageFromIframe(firstMounted.iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel: firstMounted.channel,
      state: 'paid',
    })
    postMessageFromIframe(firstMounted.iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel: firstMounted.channel,
      state: 'overpaid',
    })
    postMessageFromIframe(firstMounted.iframe, 'https://embed.test', {
      type: 'invoq:close',
      channel: firstMounted.channel,
    })

    await expect(first.result).resolves.toEqual({
      status: 'paid',
      invoiceId: 'inv_test_123',
    })

    const second = openTestCheckout()
    const secondMounted = getMountedCheckout()

    postMessageFromIframe(secondMounted.iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel: secondMounted.channel,
      state: 'overpaid',
    })

    await expect(second.result).resolves.toEqual({
      status: 'overpaid',
      invoiceId: 'inv_test_123',
    })
  })

  it('resolves review_required without treating it as paid', async () => {
    const checkout = openTestCheckout()
    const { iframe, channel } = getMountedCheckout()

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel,
      state: 'review_required',
    })

    await expect(checkout.result).resolves.toEqual({
      status: 'review_required',
      invoiceId: 'inv_test_123',
    })
  })

  it('resolves closed with user reason on embed close', async () => {
    const checkout = openTestCheckout()
    const { iframe, channel } = getMountedCheckout()

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:close',
      channel,
    })

    expect(document.body.firstElementChild).toBeNull()
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'user',
    })
  })

  it('ignores unknown state values', async () => {
    const checkout = openTestCheckout()
    const { iframe, channel } = getMountedCheckout()

    postMessageFromIframe(iframe, 'https://embed.test', {
      type: 'invoq:state',
      channel,
      state: 'refunded',
    })

    checkout.close()

    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })

  it('closes the previous checkout before opening the next one', async () => {
    const first = openTestCheckout()
    const second = openTestCheckout()

    await expect(first.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'replaced',
    })

    expect(document.body.firstElementChild).toBeTruthy()

    second.close()
    await expect(second.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })

  it('supports AbortSignal cancellation', async () => {
    const abortController = new AbortController()
    const checkout = openTestCheckout({ signal: abortController.signal })

    abortController.abort()

    expect(document.body.firstElementChild).toBeNull()
    await expect(checkout.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'aborted',
    })
  })

  it('does not replace an active checkout when the new signal is already aborted', async () => {
    const active = openTestCheckout()
    const abortController = new AbortController()
    abortController.abort()

    const aborted = openTestCheckout({ signal: abortController.signal })

    expect(document.body.firstElementChild).toBeTruthy()
    await expect(aborted.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'aborted',
    })

    active.close()
    await expect(active.result).resolves.toEqual({
      status: 'closed',
      invoiceId: 'inv_test_123',
      reason: 'programmatic',
    })
  })
})

type OpenTestCheckoutOptions = {
  checkoutOrigin?: string
  styleNonce?: string
  signal?: AbortSignal
}

let openedCheckouts: Checkout[] = []

function openTestCheckout(options: OpenTestCheckoutOptions = {}): Checkout {
  const checkout = openCheckout('inv_test_123', {
    checkoutOrigin: options.checkoutOrigin ?? 'https://embed.test',
    styleNonce: options.styleNonce,
    signal: options.signal,
  })
  openedCheckouts.push(checkout)
  return checkout
}

function closeOpenedCheckouts(): void {
  for (let index = openedCheckouts.length - 1; index >= 0; index -= 1) {
    openedCheckouts[index]?.close()
  }

  openedCheckouts = []
}

function getMountedCheckout() {
  const host = document.body.firstElementChild

  if (!(host instanceof HTMLDivElement) || !host.shadowRoot) {
    throw new Error('checkout host was not mounted')
  }

  const backdrop = host.shadowRoot.querySelector<HTMLDivElement>('.backdrop')
  const spinner = host.shadowRoot.querySelector<HTMLDivElement>('.spinner')
  const iframe =
    host.shadowRoot.querySelector<HTMLIFrameElement>('.checkout-frame')

  if (!backdrop || !spinner || !iframe) {
    throw new Error('checkout shadow tree is incomplete')
  }

  const channel = new URL(iframe.src).searchParams.get('channel')

  if (!channel) {
    throw new Error('checkout channel was not set')
  }

  return {
    host,
    backdrop,
    spinner,
    iframe,
    channel,
  }
}

function postMessageFromIframe(
  iframe: HTMLIFrameElement,
  origin: string,
  data: unknown,
): void {
  const event = new MessageEvent('message', {
    data,
    origin,
  })
  Object.defineProperty(event, 'source', {
    value: iframe.contentWindow,
  })
  window.dispatchEvent(event)
}

function postMessageFromWindow(origin: string, data: unknown): void {
  const event = new MessageEvent('message', {
    data,
    origin,
  })
  Object.defineProperty(event, 'source', {
    value: window,
  })
  window.dispatchEvent(event)
}
