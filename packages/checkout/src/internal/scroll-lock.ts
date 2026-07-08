export function lockScroll(window: Window, document: Document) {
  const html = document.documentElement
  const body = document.body
  const htmlOverflow = html.style.overflow
  const bodyOverflow = body.style.overflow
  const bodyPaddingRight = body.style.paddingRight
  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth)
  const computedPaddingRight = Number.parseFloat(
    window.getComputedStyle(body).paddingRight || '0',
  )

  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`
  }

  let released = false

  return {
    release() {
      if (released) {
        return
      }

      released = true
      html.style.overflow = htmlOverflow
      body.style.overflow = bodyOverflow
      body.style.paddingRight = bodyPaddingRight
    },
  }
}
