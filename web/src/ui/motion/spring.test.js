import { describe, it, expect, vi } from "vitest";
import { createSpring, springCoefficients } from "./spring.js";

/** Deterministic frame clock: run frames manually at 60fps. */
function createClock() {
  let time = 0;
  let queue = [];
  return {
    now: () => time,
    schedule: (callback) => {
      queue.push(callback);
      return callback;
    },
    cancel: (handle) => {
      queue = queue.filter((callback) => callback !== handle);
    },
    frame() {
      time += 1000 / 60;
      const callbacks = queue;
      queue = [];
      callbacks.forEach((callback) => callback(time));
    },
    runUntilIdle(max = 600) {
      for (let i = 0; i < max && queue.length; i += 1) this.frame();
    },
    get pending() {
      return queue.length;
    },
  };
}

function setup(options = {}) {
  const clock = createClock();
  const values = [];
  const spring = createSpring({
    onUpdate: (value) => values.push(value),
    schedule: clock.schedule,
    cancel: clock.cancel,
    now: clock.now,
    ...options,
  });
  return { clock, spring, values };
}

describe("springCoefficients", () => {
  it("maps response/damping to stiffness/friction", () => {
    const { stiffness, friction } = springCoefficients({ damping: 1, response: 1 });
    expect(stiffness).toBeCloseTo((2 * Math.PI) ** 2);
    expect(friction).toBeCloseTo(4 * Math.PI);
  });
});

describe("createSpring", () => {
  it("settles exactly on the target and calls onRest once", () => {
    const { clock, spring, values } = setup();
    const onRest = vi.fn();
    spring.to(100, { onRest });
    clock.runUntilIdle();
    expect(spring.get()).toBe(100);
    expect(values.at(-1)).toBe(100);
    expect(onRest).toHaveBeenCalledTimes(1);
    expect(spring.isAnimating()).toBe(false);
  });

  it("does not overshoot when critically damped", () => {
    const { clock, spring, values } = setup();
    spring.to(100, { damping: 1, response: 0.3 });
    clock.runUntilIdle();
    expect(Math.max(...values)).toBeLessThanOrEqual(100.0001);
  });

  it("overshoots when under-damped", () => {
    const { clock, spring, values } = setup();
    spring.to(100, { damping: 0.5, response: 0.3 });
    clock.runUntilIdle();
    expect(Math.max(...values)).toBeGreaterThan(100);
  });

  it("hands off an initial velocity", () => {
    const { clock, spring } = setup();
    spring.to(0, { velocity: 2000 });
    clock.frame();
    expect(spring.get()).toBeGreaterThan(0);
  });

  it("keeps position and velocity when retargeted mid-flight", () => {
    const { clock, spring } = setup();
    spring.to(100);
    for (let i = 0; i < 5; i += 1) clock.frame();
    const position = spring.get();
    const velocity = spring.getVelocity();
    expect(velocity).toBeGreaterThan(0);

    spring.to(0);
    expect(spring.get()).toBe(position);
    expect(spring.getVelocity()).toBe(velocity);
    clock.frame();
    // Momentum carries it forward briefly before reversing — no brick wall.
    expect(spring.get()).toBeGreaterThan(position - 1);
  });

  it("drops the previous onRest when interrupted", () => {
    const { clock, spring } = setup();
    const first = vi.fn();
    const second = vi.fn();
    spring.to(100, { onRest: first });
    clock.frame();
    spring.to(50, { onRest: second });
    clock.runUntilIdle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("set() jumps immediately and cancels any animation", () => {
    const { clock, spring, values } = setup();
    spring.to(100);
    clock.frame();
    spring.set(42);
    expect(values.at(-1)).toBe(42);
    expect(spring.getVelocity()).toBe(0);
    expect(clock.pending).toBe(0);
  });
});
