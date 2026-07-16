import type { CheckoutMode } from '../types'

export type EmbedMessage =
  | { type: 'invoq:ready' }
  | { type: 'invoq:close' }
  | { type: 'invoq:state'; state: string; mode: CheckoutMode }

export function parseEmbedMessage(
  event: MessageEvent,
  options: {
    iframe: HTMLIFrameElement
    checkoutOrigin: string
    channel: string
  },
): EmbedMessage | null {
  if (event.source !== options.iframe.contentWindow) {
    return null
  }

  if (event.origin !== options.checkoutOrigin) {
    return null
  }

  const data = event.data

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return null
  }

  const message = data as Record<string, unknown>

  if (typeof message.type !== 'string') {
    return null
  }

  if (message.channel !== options.channel) {
    return null
  }

  switch (message.type) {
    case 'invoq:ready':
      return {
        type: 'invoq:ready',
      }
    case 'invoq:close':
      return {
        type: 'invoq:close',
      }
    case 'invoq:state':
      return {
        type: 'invoq:state',
        state: typeof message.state === 'string' ? message.state : '',
        // `mode` rides every state event so a host can tell a simulated test
        // payment from real money. Anything that isn't 'test' degrades to
        // 'live' — the safe direction: never label real money as a test.
        mode: message.mode === 'test' ? 'test' : 'live',
      }
    default:
      return null
  }
}
