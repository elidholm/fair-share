import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createSpring } from "./spring.js";

/**
 * Stable spring instance bound to the component's lifetime. `onUpdate` should
 * write styles directly to a ref'd element — no React re-render per frame.
 * @param {number} initial
 * @param {(value: number) => void} onUpdate
 * @param {{precision?: number}} [options]
 */
export function useSpring(initial, onUpdate, options = {}) {
  const onUpdateRef = useRef(onUpdate);
  useLayoutEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const [spring] = useState(() =>
    createSpring({ ...options, initial, onUpdate: (value) => onUpdateRef.current?.(value) }),
  );

  useEffect(() => () => spring.stop(), [spring]);

  return spring;
}
