/**
 * Distance a flick will travel before coming to rest, using UIScrollView-style
 * exponential deceleration (from Apple's "Designing Fluid Interfaces").
 * @param {number} velocity Release velocity in px/s.
 * @param {number} [decelerationRate=0.998] 0.998 ≈ normal scroll, 0.99 ≈ fast.
 * @returns {number} Projected distance in px (signed).
 */
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary: the further you pull, the less the
 * element follows.
 * @param {number} overshoot Signed distance past the boundary in px.
 * @param {number} dimension Size of the draggable axis in px.
 * @param {number} [constant=0.55]
 * @returns {number} Damped (signed) offset in px.
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Tracks recent pointer samples and reports velocity over a short window, so a
 * single noisy final event cannot dominate the release velocity.
 */
export class VelocityTracker {
  /** @param {number} [windowMs=100] */
  constructor(windowMs = 100) {
    this.windowMs = windowMs;
    this.samples = [];
  }

  reset() {
    this.samples = [];
  }

  /**
   * @param {number} position
   * @param {number} time Timestamp in ms (e.g. `event.timeStamp`).
   */
  add(position, time) {
    this.samples.push({ position, time });
    const cutoff = time - this.windowMs;
    while (this.samples.length > 2 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  /** @returns {number} Velocity in px/s (0 when not enough data). */
  velocity() {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    return ((last.position - first.position) / dt) * 1000;
  }
}
