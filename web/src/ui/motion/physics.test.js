import { describe, it, expect } from "vitest";
import { project, rubberband, VelocityTracker } from "./physics.js";

describe("project", () => {
  it("returns 0 for no velocity", () => {
    expect(project(0)).toBe(0);
  });

  it("matches Apple's exponential-decay projection", () => {
    // 1000 px/s at 0.998 → 1 * 0.998 / 0.002 = 499 px
    expect(project(1000)).toBeCloseTo(499);
  });

  it("preserves direction and shortens with faster deceleration", () => {
    expect(project(-1000)).toBeCloseTo(-499);
    expect(Math.abs(project(1000, 0.99))).toBeLessThan(Math.abs(project(1000)));
  });
});

describe("rubberband", () => {
  it("resists progressively and never exceeds the raw overshoot", () => {
    const small = rubberband(20, 800);
    const large = rubberband(400, 800);
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(20);
    expect(large).toBeLessThan(400);
    expect(large / 400).toBeLessThan(small / 20);
  });

  it("is symmetric in sign", () => {
    expect(rubberband(-100, 800)).toBeCloseTo(-rubberband(100, 800));
  });

  it("returns 0 for a degenerate dimension", () => {
    expect(rubberband(100, 0)).toBe(0);
  });
});

describe("VelocityTracker", () => {
  it("reports px/s over recent samples", () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0);
    tracker.add(10, 10);
    tracker.add(20, 20);
    expect(tracker.velocity()).toBeCloseTo(1000);
  });

  it("drops samples outside the window", () => {
    const tracker = new VelocityTracker(50);
    tracker.add(0, 0);
    tracker.add(1000, 10); // stale fast burst
    tracker.add(1000, 200);
    tracker.add(1010, 210);
    expect(tracker.velocity()).toBeCloseTo(1000);
  });

  it("returns 0 without enough data and after reset", () => {
    const tracker = new VelocityTracker();
    expect(tracker.velocity()).toBe(0);
    tracker.add(0, 0);
    tracker.add(10, 10);
    tracker.reset();
    expect(tracker.velocity()).toBe(0);
  });
});
