import type {
  Checkout,
  CheckoutCloseReason,
  CheckoutResult,
  OpenCheckoutOptions,
} from '../types'
import { buildEmbedUrl } from './embed-url'
import { parseEmbedMessage } from './message-bridge'
import { lockScroll } from './scroll-lock'
import { createCheckoutHost } from './shadow-host'

const DEFAULT_READY_TIMEOUT_MS = 15_000

type ActiveCheckout = {
  invoiceId: string
  host: ReturnType<typeof createCheckoutHost>
  scrollLock: ReturnType<typeof lockScroll>
  window: Window
  checkoutOrigin: string
  channel: string
  readyTimeoutId: number
  ready: boolean
  resultSettled: boolean
  resolveResult: (result: CheckoutResult) => void
  removeListeners: () => void
  removeAbortListener: () => void
}

type TerminalCheckoutStatus = Extract<
  CheckoutResult,
  { status: 'paid' | 'overpaid' | 'review_required' }
>['status']

let activeCheckout: ActiveCheckout | null = null

export function openCheckout(
  invoiceId: string,
  options: OpenCheckoutOptions = {},
): Checkout {
  return mountCheckout(invoiceId, options)
}

function mountCheckout(
  invoiceId: string,
  options: OpenCheckoutOptions,
): Checkout {
  const environment = resolveEnvironment()
  const channel = createChannel(environment.window)
  const embed = buildEmbedUrl(
    {
      invoiceId,
      checkoutOrigin: options.checkoutOrigin,
    },
    environment.window.location.origin,
    channel,
  )

  if (options.signal?.aborted) {
    return createAbortedCheckout(invoiceId)
  }

  // Create the new host before tearing down the current checkout so a host
  // creation failure leaves the current checkout untouched. The new scroll
  // lock must still be taken after the old one releases.
  const host = createCheckoutHost(environment.document, {
    styleNonce: options.styleNonce,
  })

  if (activeCheckout) {
    closeActiveCheckout(activeCheckout, 'replaced')
  }

  const scrollLock = lockScroll(environment.window, environment.document)
  let resolveResult!: (result: CheckoutResult) => void
  const result = new Promise<CheckoutResult>((resolve) => {
    resolveResult = resolve
  })

  const checkout: ActiveCheckout = {
    invoiceId,
    host,
    scrollLock,
    window: environment.window,
    checkoutOrigin: embed.checkoutOrigin,
    channel,
    readyTimeoutId: 0,
    ready: false,
    resultSettled: false,
    resolveResult,
    removeListeners: () => {},
    removeAbortListener: () => {},
  }

  activeCheckout = checkout

  const handleWindowMessage = (event: MessageEvent) => {
    handleMessage(checkout, event)
  }
  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (
      event.key !== 'Escape' ||
      event.isComposing ||
      activeCheckout !== checkout
    ) {
      return
    }

    event.preventDefault()
    closeActiveCheckout(checkout, 'user')
  }
  environment.window.addEventListener('message', handleWindowMessage)
  // Capture phase so page handlers that stop propagation cannot swallow
  // Escape; the remove call must pass the same flag.
  environment.window.addEventListener('keydown', handleWindowKeydown, true)

  checkout.removeListeners = () => {
    environment.window.removeEventListener('message', handleWindowMessage)
    environment.window.removeEventListener('keydown', handleWindowKeydown, true)
  }

  const signal = options.signal

  if (signal) {
    const handleAbort = () => {
      closeActiveCheckout(checkout, 'aborted')
    }
    signal.addEventListener('abort', handleAbort, { once: true })
    checkout.removeAbortListener = () => {
      signal.removeEventListener('abort', handleAbort)
    }
  }

  checkout.readyTimeoutId = environment.window.setTimeout(() => {
    failCheckout(checkout)
  }, DEFAULT_READY_TIMEOUT_MS)

  host.iframe.src = embed.iframeUrl

  return {
    invoiceId,
    result,
    close: () => {
      closeActiveCheckout(checkout, 'programmatic')
    },
  }
}

function handleMessage(checkout: ActiveCheckout, event: MessageEvent): void {
  if (activeCheckout !== checkout) {
    return
  }

  const message = parseEmbedMessage(event, {
    iframe: checkout.host.iframe,
    checkoutOrigin: checkout.checkoutOrigin,
    channel: checkout.channel,
  })

  if (!message) {
    return
  }

  // Any verified embed message proves the embed has loaded, even if it
  // arrives before (or without) invoq:ready, so the ready timeout never
  // tears down a live checkout.
  markReady(checkout)

  switch (message.type) {
    case 'invoq:close':
      closeActiveCheckout(checkout, 'user')
      break
    case 'invoq:state':
      if (isTerminalCheckoutStatus(message.state)) {
        settleResult(checkout, {
          status: message.state,
          invoiceId: checkout.invoiceId,
          mode: message.mode,
        })
      }
      break
  }
}

function isTerminalCheckoutStatus(
  value: unknown,
): value is TerminalCheckoutStatus {
  return value === 'paid' || value === 'overpaid' || value === 'review_required'
}

function markReady(checkout: ActiveCheckout): void {
  if (checkout.ready) {
    return
  }

  checkout.ready = true
  checkout.window.clearTimeout(checkout.readyTimeoutId)
  // aria-modal is only asserted once the embed's own focus trap is live;
  // claiming modality during the loading phase strands AT users on hidden
  // but still-tabbable background content.
  checkout.host.host.setAttribute('aria-modal', 'true')
  checkout.host.spinner.hidden = true

  try {
    checkout.host.iframe.focus({ preventScroll: true })
  } catch {
    checkout.host.iframe.focus()
  }
}

function failCheckout(checkout: ActiveCheckout): void {
  if (activeCheckout !== checkout) {
    return
  }

  destroyCheckout(checkout)
  settleResult(checkout, {
    status: 'failed',
    invoiceId: checkout.invoiceId,
  })
}

function closeActiveCheckout(
  checkout: ActiveCheckout,
  reason: CheckoutCloseReason,
): void {
  if (activeCheckout !== checkout) {
    return
  }

  destroyCheckout(checkout)
  settleResult(checkout, {
    status: 'closed',
    invoiceId: checkout.invoiceId,
    reason,
  })
}

function destroyCheckout(checkout: ActiveCheckout): void {
  if (activeCheckout !== checkout) {
    return
  }

  activeCheckout = null

  checkout.window.clearTimeout(checkout.readyTimeoutId)
  checkout.removeListeners()
  checkout.removeAbortListener()
  checkout.scrollLock.release()
  checkout.host.host.parentNode?.removeChild(checkout.host.host)
}

function settleResult(checkout: ActiveCheckout, result: CheckoutResult): void {
  if (checkout.resultSettled) {
    return
  }

  checkout.resultSettled = true
  checkout.resolveResult(result)
}

function createAbortedCheckout(invoiceId: string): Checkout {
  return {
    invoiceId,
    result: Promise.resolve({
      status: 'closed',
      invoiceId,
      reason: 'aborted',
    }),
    close: () => {},
  }
}

function resolveEnvironment(): {
  window: Window
  document: Document
} {
  const resolvedWindow = typeof window !== 'undefined' ? window : undefined
  const resolvedDocument =
    typeof document !== 'undefined' ? document : resolvedWindow?.document

  if (!resolvedWindow || !resolvedDocument || !resolvedDocument.body) {
    throw new Error('This browser does not support invoq checkout.')
  }

  return {
    window: resolvedWindow,
    document: resolvedDocument,
  }
}

function createChannel(window: Window): string {
  const crypto = window.crypto

  if (crypto && 'randomUUID' in crypto) {
    return `invoq_${crypto.randomUUID()}`
  }

  return `invoq_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`
}
