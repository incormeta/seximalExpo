import assert from "node:assert/strict";
import test from "node:test";

import { syncPwaViewport } from "./pwa-viewport.web";

function withBrowser(installed: "standalone" | "ios" | false, check: (browser: {
  window: { innerHeight: number };
  properties: Map<string, string>;
  listeners: Map<string, () => void>;
}) => void) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const properties = new Map<string, string>();
  const listeners = new Map<string, () => void>();
  const window = {
    innerHeight: 874,
    navigator: { standalone: installed === "ios" },
    matchMedia: () => ({ matches: installed === "standalone" }),
    addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  const document = { documentElement: { style: {
    setProperty: (name: string, value: string) => properties.set(name, value),
    removeProperty: (name: string) => properties.delete(name),
  } } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  try {
    check({ window, properties, listeners });
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
}

test("server rendering does not need a browser viewport", () => {
  assert.doesNotThrow(() => syncPwaViewport()());
});

test("Safari browser mode retains CSS viewport sizing", () => {
  withBrowser(false, ({ properties, listeners }) => {
    syncPwaViewport()();
    assert.equal(properties.size, 0);
    assert.equal(listeners.size, 0);
  });
});

for (const installed of ["standalone", "ios"] as const) {
  test(`${installed} mode fills the measured window and follows resize and resume`, () => {
    withBrowser(installed, ({ window, properties, listeners }) => {
      const stop = syncPwaViewport();
      assert.equal(properties.get("--app-viewport-height"), "874px");
      for (const [event, height] of [["resize", 780], ["orientationchange", 402], ["pageshow", 874]] as const) {
        window.innerHeight = height;
        listeners.get(event)!();
        assert.equal(properties.get("--app-viewport-height"), `${height}px`);
      }
      window.innerHeight = 0;
      listeners.get("resize")!();
      assert.equal(properties.get("--app-viewport-height"), "874px");
      stop();
      assert.equal(properties.size, 0);
      assert.equal(listeners.size, 0);
    });
  });
}
