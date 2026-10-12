// Native builds already receive their viewport from the operating system.
export function syncPwaViewport() {
  return () => {};
}
