/* Dezente Haptik — nur wo es etwas bestätigt (apple-design §13). */
function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* nicht unterstützt — egal */
  }
}
export const haptic = {
  tap: () => vibrate(8),
  success: () => vibrate([10, 40, 18]),
  soft: () => vibrate(5),
}
