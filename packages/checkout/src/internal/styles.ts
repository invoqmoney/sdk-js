export const shadowStyles = `
:host {
  all: initial;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.root {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  overflow: hidden;
}

.backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  z-index: 0;
  background: rgba(12, 11, 8, 0.32);
  background: oklch(0.15 0.006 100 / 32%);
  -webkit-backdrop-filter: blur(8px) saturate(0.9);
  backdrop-filter: blur(8px) saturate(0.9);
}

.checkout-frame {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  z-index: 1;
  width: 100vw;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  border: 0;
  background: transparent;
  color-scheme: light;
}

.spinner {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  display: grid;
  place-items: center;
  pointer-events: none;
}

/* The class's own display would beat the UA [hidden] rule, so restate it. */
.spinner[hidden] {
  display: none;
}

.spinner::after {
  width: 32px;
  height: 32px;
  content: "";
  border: 2px solid rgba(15, 23, 42, 0.18);
  border-top-color: rgb(15, 23, 42);
  border-color: color-mix(in oklab, CanvasText 15%, transparent);
  border-top-color: CanvasText;
  border-radius: 999px;
  animation: invoq-spin 720ms linear infinite;
}

@keyframes invoq-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner::after {
    animation-duration: 1600ms;
  }
}
`
