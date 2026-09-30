import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Alert from "../Alert/Alert.jsx";
import Button from "../Button/Button.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import Skeleton from "../Skeleton/Skeleton.jsx";
import VisuallyHidden from "../VisuallyHidden/VisuallyHidden.jsx";
import { cx } from "../../utils/cx.js";

/** True only once `active` has stayed true for `delay` ms. */
function useDelayedFlag(active, delay) {
  const [elapsed, setElapsed] = useState(delay <= 0);

  useEffect(() => {
    if (!active || delay <= 0) {
      setElapsed(delay <= 0);
      return undefined;
    }
    setElapsed(false);
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return active && elapsed;
}

/**
 * Renders exactly one of: loading → error → empty → content.
 *
 * - The skeleton appears only after `delay` ms, so fast responses never flash
 *   a placeholder.
 * - Loading is announced once via a polite live region and `aria-busy`.
 * - Errors offer a retry when `onRetry` is provided.
 *
 * `children` may be a node or a render function (called only when content is
 * ready, so it can safely dereference loaded data).
 */
function AsyncContent({
  loading = false,
  error = null,
  isEmpty = false,
  onRetry,
  skeleton,
  empty,
  errorTitle = "Something went wrong",
  retryLabel = "Try again",
  loadingLabel = "Loading",
  delay = 150,
  className,
  children,
}) {
  const showSkeleton = useDelayedFlag(loading, delay);

  let content;
  if (loading) {
    content = showSkeleton ? (skeleton ?? <Skeleton lines={3} />) : null;
  } else if (error) {
    content = (
      <Alert
        tone="error"
        title={errorTitle}
        action={onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>{retryLabel}</Button>
        )}
      >
        {typeof error === "string" ? error : error.message}
      </Alert>
    );
  } else if (isEmpty) {
    content = empty ?? <EmptyState title="Nothing here yet" compact />;
  } else {
    content = typeof children === "function" ? children() : children;
  }

  return (
    <div className={cx("fs-async", className)} aria-busy={loading || undefined}>
      <VisuallyHidden role="status">{loading ? loadingLabel : ""}</VisuallyHidden>
      {content}
    </div>
  );
}

AsyncContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error), PropTypes.shape({ message: PropTypes.string })]),
  isEmpty: PropTypes.bool,
  onRetry: PropTypes.func,
  skeleton: PropTypes.node,
  empty: PropTypes.node,
  errorTitle: PropTypes.node,
  retryLabel: PropTypes.string,
  loadingLabel: PropTypes.string,
  delay: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default AsyncContent;
