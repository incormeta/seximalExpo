import { INSTANT_MS } from "../seximal/time";

type Listener = () => void;
type ClockRuntime = {
  now: () => number;
  schedule: (callback: () => void, smooth: boolean) => () => void;
};

const runtime: ClockRuntime = {
  now: Date.now,
  schedule(callback, smooth) {
    if (smooth) {
      const id = requestAnimationFrame(callback);
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(callback, INSTANT_MS);
    return () => clearTimeout(id);
  },
};

/** One wall-clock source; only animation leaves subscribe at frame frequency. */
export function createClockSource(clockRuntime: ClockRuntime = runtime) {
  let displayTime = clockRuntime.now();
  let animationTime = displayTime;
  let cancel: (() => void) | undefined;
  const displayListeners = new Set<Listener>();
  const animationListeners = new Set<Listener>();
  const subscribe = (listeners: Set<Listener>) => (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };
  const stop = () => { cancel?.(); cancel = undefined; };
  const update = (force: boolean) => {
    animationTime = clockRuntime.now();
    // Refresh immediately on resume and after a backwards system-clock change.
    if (force || animationTime - displayTime >= INSTANT_MS || animationTime < displayTime) {
      displayTime = animationTime;
      displayListeners.forEach((listener) => listener());
    }
    animationListeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => displayTime,
    getAnimationSnapshot: () => animationTime,
    subscribe: subscribe(displayListeners),
    subscribeAnimation: subscribe(animationListeners),
    start(smooth: boolean) {
      stop();
      update(true);
      const tick = () => {
        // Native/browser timers may round INSTANT_MS down to whole milliseconds.
        // Keep every legacy timer tick; throttle only when running at frame rate.
        update(!smooth);
        cancel = clockRuntime.schedule(tick, smooth);
      };
      cancel = clockRuntime.schedule(tick, smooth);
    },
    stop,
  };
}

export type ClockSource = ReturnType<typeof createClockSource>;
