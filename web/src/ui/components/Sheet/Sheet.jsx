import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X } from "react-feather";
import IconButton from "../IconButton/IconButton.jsx";
import { useSpring } from "../../motion/useSpring.js";
import { usePrefersReducedMotion } from "../../motion/usePrefersReducedMotion.js";
import { project, rubberband, VelocityTracker } from "../../motion/physics.js";
import { cx } from "../../utils/cx.js";
import "./Sheet.scss";

// Presentation is not momentum-driven → critically damped. Settling after a
// drag carries the finger's momentum → slight bounce (Apple's drawer values).
const PRESENT = { damping: 1, response: 0.35 };
const DISMISS = { damping: 1, response: 0.3 };
const SETTLE = { damping: 0.8, response: 0.3 };
const FADE = { damping: 1, response: 0.2 };

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal bottom sheet.
 *
 * Motion: slides up with a spring; the header can be dragged 1:1 (respecting
 * the grab point). On release, the flick's momentum is projected to decide
 * dismiss vs. settle, and the release velocity is handed to the spring so
 * there is no seam between finger and animation. It can be grabbed mid-flight
 * and reopening while closing reverses from the on-screen position.
 *
 * Accessibility: role="dialog" + aria-modal, labelled by `title`, focus moves
 * in and is trapped, Escape closes, background is made `inert` and scroll
 * locked, focus returns to the trigger. With prefers-reduced-motion,
 * programmatic open/close cross-fade instead of sliding.
 */
function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  showCloseButton = true,
  closeLabel = "Close",
  initialFocusRef,
  className,
}) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const reducedMotion = usePrefersReducedMotion();
  const titleId = useId();
  const descriptionId = useId();

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const scrimRef = useRef(null);
  const distanceRef = useRef(1);
  const presentedRef = useRef(false);
  const fadeOnlyRef = useRef(false);
  const dragRef = useRef(null);
  const [tracker] = useState(() => new VelocityTracker());

  const apply = useCallback((offset) => {
    const panel = panelRef.current;
    if (!panel) return;
    const progress = Math.min(1, Math.max(0, 1 - offset / distanceRef.current));
    if (fadeOnlyRef.current) {
      panel.style.transform = "";
      panel.style.opacity = String(progress);
    } else {
      panel.style.transform = `translate3d(0, ${offset}px, 0)`;
      panel.style.opacity = "";
    }
    if (scrimRef.current) scrimRef.current.style.opacity = String(progress);
  }, []);

  const spring = useSpring(0, apply);

  // Distance from the panel's resting position to fully off-screen.
  // offsetTop ignores transforms, so this is stable mid-animation.
  const measure = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    const distance =
      (root && panel ? root.clientHeight - panel.offsetTop : 0) ||
      panel?.offsetHeight ||
      window.innerHeight ||
      1;
    distanceRef.current = distance;
    return distance;
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const distance = measure();

    if (open) {
      if (!presentedRef.current) {
        presentedRef.current = true;
        fadeOnlyRef.current = reducedMotion;
        spring.set(distance);
      }
      spring.to(0, fadeOnlyRef.current ? FADE : PRESENT);
      return;
    }

    // Only switch to a fade when resting; mid-drag it would visibly jump.
    if (reducedMotion && Math.abs(spring.get()) < 1) fadeOnlyRef.current = true;
    spring.to(distance, {
      ...(fadeOnlyRef.current ? FADE : DISMISS),
      onRest: () => {
        presentedRef.current = false;
        setMounted(false);
      },
    });
  }, [open, mounted, reducedMotion, spring, measure]);

  // Modal environment: inert background, scroll lock, focus in/out.
  useEffect(() => {
    if (!mounted) return undefined;
    const root = rootRef.current;
    const previouslyFocused = document.activeElement;
    const inerted = Array.from(document.body.children).filter(
      (element) => element !== root && !element.hasAttribute("inert"),
    );
    inerted.forEach((element) => element.setAttribute("inert", ""));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    (initialFocusRef?.current ?? panelRef.current)?.focus({ preventScroll: true });

    return () => {
      inerted.forEach((element) => element.removeAttribute("inert"));
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // initialFocusRef is intentionally read once, when the sheet opens.
  }, [mounted]);

  function requestClose() {
    if (dismissible) onClose?.();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      requestClose();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("button, a, input, select, textarea")) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    // Catch it mid-flight: freeze at the presentation value, not the target.
    spring.stop();
    measure();
    if (fadeOnlyRef.current) {
      fadeOnlyRef.current = false;
      apply(spring.get());
    }
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, origin: spring.get() };
    tracker.reset();
    tracker.add(event.clientY, event.timeStamp);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    tracker.add(event.clientY, event.timeStamp);
    const raw = drag.origin + (event.clientY - drag.startY);
    const resisted = raw < 0 || !dismissible;
    spring.set(resisted ? rubberband(raw, distanceRef.current) : raw);
  }

  function handlePointerEnd(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;

    const velocity = event.type === "pointercancel" ? 0 : tracker.velocity();
    const projected = spring.get() + project(velocity);

    // Settle back by default (with the finger's velocity). If the parent
    // accepts the close, the close effect retargets and the same velocity
    // carries through, so there's no seam either way.
    spring.to(0, { ...SETTLE, velocity });
    if (dismissible && projected > distanceRef.current / 2) onClose?.();
  }

  if (!mounted) return null;

  return createPortal(
    <div ref={rootRef} className={cx("fs-sheet-root", className)} onKeyDown={handleKeyDown}>
      <div
        ref={scrimRef}
        className="fs-sheet__scrim"
        aria-hidden="true"
        data-testid="sheet-scrim"
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="fs-sheet"
      >
        <div
          className="fs-sheet__header"
          data-testid="sheet-drag-handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <span className="fs-sheet__grabber" aria-hidden="true" />
          <div className="fs-sheet__titles">
            <h2 id={titleId} className="fs-sheet__title">{title}</h2>
            {description && <p id={descriptionId} className="fs-sheet__description">{description}</p>}
          </div>
          {dismissible && showCloseButton && (
            <IconButton label={closeLabel} variant="secondary" size="sm" onClick={requestClose}>
              <X />
            </IconButton>
          )}
        </div>
        <div className="fs-sheet__body">{children}</div>
        {footer && <div className="fs-sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

Sheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  dismissible: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  closeLabel: PropTypes.string,
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
  className: PropTypes.string,
};

export default Sheet;
