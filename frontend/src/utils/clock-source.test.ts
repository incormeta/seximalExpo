import assert from "node:assert/strict";
import test from "node:test";

import { createClockSource } from "./clock-source";

function fakeClock() {
  let time = 1000;
  const pending = new Map<() => void, boolean>();
  const clock = createClockSource({
    now: () => time,
    schedule: (callback, smooth) => {
      pending.set(callback, smooth);
      return () => { pending.delete(callback); };
    },
  });
  return {
    clock,
    pending,
    setTime: (next: number) => { time = next; },
    tick(next: number) {
      time = next;
      const callbacks = [...pending.keys()];
      pending.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test("one scheduler supplies smooth animation while throttling existing readouts", () => {
  const { clock, pending, tick } = fakeClock();
  let displayUpdates = 0;
  let animationUpdates = 0;
  const unsubscribe = clock.subscribe(() => { displayUpdates++; });
  clock.subscribeAnimation(() => { animationUpdates++; });
  clock.start(true);
  for (const time of [1016, 1032, 1048, 1064]) tick(time);
  assert.equal(animationUpdates, 5);
  assert.equal(displayUpdates, 1);
  assert.equal(clock.getAnimationSnapshot(), 1064);
  assert.equal(clock.getSnapshot(), 1000);
  tick(1080);
  assert.equal(displayUpdates, 2);
  assert.equal(clock.getSnapshot(), 1080);
  assert.equal(pending.size, 1);
  unsubscribe();
  tick(1200);
  assert.equal(displayUpdates, 2);
  clock.stop();
  assert.equal(pending.size, 0);
});

test("pause cancels animation, resume samples real time, and mode changes never add a second scheduler", () => {
  const { clock, pending, setTime, tick } = fakeClock();
  clock.start(true);
  assert.deepEqual([...pending.values()], [true]);
  clock.stop();
  assert.equal(pending.size, 0);
  setTime(50_000);
  clock.start(false);
  assert.equal(clock.getSnapshot(), 50_000);
  assert.equal(clock.getAnimationSnapshot(), 50_000);
  assert.deepEqual([...pending.values()], [false]);
  tick(50_077);
  assert.equal(clock.getSnapshot(), 50_077);
  clock.start(true);
  assert.deepEqual([...pending.values()], [true]);
  clock.stop();
});

test("system-clock corrections refresh the display immediately", () => {
  const { clock, tick } = fakeClock();
  clock.start(true);
  tick(500);
  assert.equal(clock.getSnapshot(), 500);
  assert.equal(clock.getAnimationSnapshot(), 500);
  clock.stop();
});
