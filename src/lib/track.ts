/** Send a GA4 event from a component script. A no-op in dev and wherever analytics is off. */
export function track(name: string, params?: Record<string, unknown>) {
  (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params);
}
