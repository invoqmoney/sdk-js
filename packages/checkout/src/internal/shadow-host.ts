import { shadowStyles } from './styles'

type CreateCheckoutHostOptions = {
  styleNonce?: string
}

export function createCheckoutHost(
  document: Document,
  options: CreateCheckoutHostOptions = {},
) {
  const HTMLElementConstructor = document.defaultView?.HTMLElement

  if (
    !document.body ||
    !HTMLElementConstructor?.prototype ||
    typeof HTMLElementConstructor.prototype.attachShadow !== 'function'
  ) {
    throw new Error('This browser does not support invoq checkout.')
  }

  const host = document.createElement('div')
  host.setAttribute('role', 'dialog')
  host.setAttribute('aria-label', 'invoq checkout')
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.right = '0'
  host.style.bottom = '0'
  host.style.left = '0'
  host.style.inset = '0'
  host.style.zIndex = '2147483647'

  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')

  if (options.styleNonce) {
    style.nonce = options.styleNonce
  }

  style.textContent = shadowStyles

  const root = document.createElement('div')
  root.className = 'root'

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'

  const spinner = document.createElement('div')
  spinner.className = 'spinner'
  spinner.setAttribute('aria-hidden', 'true')

  const iframe = document.createElement('iframe')
  iframe.className = 'checkout-frame'
  iframe.title = 'invoq checkout'
  iframe.allow = 'clipboard-write'
  iframe.referrerPolicy = 'strict-origin-when-cross-origin'

  root.appendChild(backdrop)
  root.appendChild(spinner)
  root.appendChild(iframe)
  shadow.appendChild(style)
  shadow.appendChild(root)
  document.body.appendChild(host)

  return {
    host,
    spinner,
    iframe,
  }
}
