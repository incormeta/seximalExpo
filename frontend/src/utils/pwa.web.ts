export function registerPwa() {
  if (__DEV__ || typeof window === 'undefined' || !window.isSecureContext || !('serviceWorker' in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch((error) => {
      console.warn('Offline support could not be enabled.', error);
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
