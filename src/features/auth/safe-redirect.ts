/** Only same-origin paths are accepted, preventing open redirects through `?redirect=`. */
export function safeRedirect(target: string | undefined, fallback = '/'): string {
  return target?.startsWith('/') && !target.startsWith('//') ? target : fallback;
}
