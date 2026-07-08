import { createHmac, timingSafeEqual } from 'node:crypto'

const textEncoder = new TextEncoder()

export function hmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
}

export function hmacSha256HexFromBytes(
  secret: string,
  timestamp: string,
  rawBody: Uint8Array,
): string {
  return createHmac('sha256', secret)
    .update(textEncoder.encode(`${timestamp}.`))
    .update(rawBody)
    .digest('hex')
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)

  if (leftBytes.length !== rightBytes.length) {
    const maxLength = Math.max(leftBytes.length, rightBytes.length, 1)
    const paddedLeft = Buffer.alloc(maxLength)
    const paddedRight = Buffer.alloc(maxLength)
    leftBytes.copy(paddedLeft)
    rightBytes.copy(paddedRight)
    timingSafeEqual(paddedLeft, paddedRight)
    return false
  }

  return timingSafeEqual(leftBytes, rightBytes)
}
