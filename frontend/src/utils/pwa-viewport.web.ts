// iOS Home Screen apps can retain Safari-sized CSS viewport units. Use the
// installed window's measured height so the app fills the space below the tabs.
export function syncPwaViewport() {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const installed = window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!installed) return () => {};

  const style = document.documentElement.style;
  const updateHeight = () => {
    if (window.innerHeight > 0) {
      style.setProperty("--app-viewport-height", `${window.innerHeight}px`);
    }
  };

  updateHeight();
  window.addEventListener("resize", updateHeight);
  window.addEventListener("orientationchange", updateHeight);
  window.addEventListener("pageshow", updateHeight);

  return () => {
    window.removeEventListener("resize", updateHeight);
    window.removeEventListener("orientationchange", updateHeight);
    window.removeEventListener("pageshow", updateHeight);
    style.removeProperty("--app-viewport-height");
  };
}
