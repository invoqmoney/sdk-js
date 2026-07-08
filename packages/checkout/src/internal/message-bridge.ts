export function parseEmbedMessage(
  event: MessageEvent,
  options: {
    iframe: HTMLIFrameElement
    checkoutOrigin: string
    channel: string
  },
) {
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
      }
    default:
      return null
  }
}
