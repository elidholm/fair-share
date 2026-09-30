/**
 * Converts Apple's designer-friendly spring parameters to physics coefficients
 * (unit mass).
 * @param {{damping?: number, response?: number}} params
 *   damping: 1 = critically damped (no overshoot), < 1 = bouncy.
 *   response: seconds to (roughly) reach the target; not a fixed duration.
 * @returns {{stiffness: number, friction: number}}
 */
export function springCoefficients({ damping = 1, response = 0.4 } = {}) {
  const safeResponse = Math.max(response, 0.01);
  return {
    stiffness: ((2 * Math.PI) / safeResponse) ** 2,
    friction: (4 * Math.PI * damping) / safeResponse,
  };
}

/**
 * One semi-implicit Euler integration step.
 * @param {{value: number, velocity: number}} state
 * @param {number} target
 * @param {{stiffness: number, friction: number}} coefficients
 * @param {number} dt Seconds.
 * @returns {{value: number, velocity: number}}
 */
export function stepSpring(state, target, { stiffness, friction }, dt) {
  const force = -stiffness * (state.value - target) - friction * state.velocity;
  const velocity = state.velocity + force * dt;
  return { value: state.value + velocity * dt, velocity };
}

const MAX_FRAME_SECONDS = 0.064;
const SUBSTEP_SECONDS = 1 / 240;

const defaultSchedule = (callback) =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : setTimeout(() => callback(performance.now()), 16);

const defaultCancel = (handle) =>
  typeof cancelAnimationFrame === "function" ? cancelAnimationFrame(handle) : clearTimeout(handle);

/**
 * Creates an interruptible, velocity-preserving 1D spring.
 *
 * Retargeting mid-flight keeps the current (presentation) value and velocity,
 * so reversals never jump or hit a velocity "brick wall".
 *
 * @param {object} options
 * @param {number} [options.initial=0]
 * @param {(value: number) => void} options.onUpdate Called every frame.
 * @param {number} [options.precision=0.5] Rest threshold in value units.
 * @param {(cb: FrameRequestCallback) => any} [options.schedule]
 * @param {(handle: any) => void} [options.cancel]
 * @param {() => number} [options.now]
 */
export function createSpring({
  initial = 0,
  onUpdate,
  precision = 0.5,
  schedule = defaultSchedule,
  cancel = defaultCancel,
  now = () => performance.now(),
}) {
  let value = initial;
  let velocity = 0;
  let target = initial;
  let coefficients = springCoefficients();
  let frame = null;
  let lastTime = 0;
  let restCallback = null;

  function tick(time) {
    const elapsed = Math.min(Math.max((time - lastTime) / 1000, 0), MAX_FRAME_SECONDS);
    lastTime = time;

    const steps = Math.max(1, Math.ceil(elapsed / SUBSTEP_SECONDS));
    const dt = elapsed / steps;
    for (let i = 0; i < steps; i += 1) {
      ({ value, velocity } = stepSpring({ value, velocity }, target, coefficients, dt));
    }

    if (Math.abs(value - target) < precision && Math.abs(velocity) < precision * 10) {
      value = target;
      velocity = 0;
      frame = null;
      onUpdate(value);
      const callback = restCallback;
      restCallback = null;
      callback?.();
      return;
    }

    onUpdate(value);
    frame = schedule(tick);
  }

  function stop() {
    if (frame !== null) cancel(frame);
    frame = null;
  }

  return {
    get: () => value,
    getVelocity: () => velocity,
    getTarget: () => target,
    isAnimating: () => frame !== null,
    stop,
    /** Jump immediately (e.g. 1:1 drag tracking). Resets velocity. */
    set(next) {
      stop();
      restCallback = null;
      value = next;
      target = next;
      velocity = 0;
      onUpdate(value);
    },
    /**
     * Animate to `next`. Omit `velocity` to carry the current velocity through
     * the retarget; pass it to hand off a gesture's release velocity (px/s).
     */
    to(next, { damping, response, velocity: initialVelocity, onRest } = {}) {
      target = next;
      coefficients = springCoefficients({ damping, response });
      if (initialVelocity !== undefined) velocity = initialVelocity;
      restCallback = onRest ?? null;
      if (frame === null) {
        lastTime = now();
        frame = schedule(tick);
      }
    },
  };
}
