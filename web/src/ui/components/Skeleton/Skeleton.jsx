import React from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import "./Skeleton.scss";

export const SKELETON_VARIANTS = ["text", "rect", "circle"];

/**
 * Decorative loading placeholder that mirrors the shape of upcoming content.
 * Always aria-hidden — announce loading via the surrounding container
 * (see AsyncContent), not per placeholder.
 */
function Skeleton({ variant = "text", width, height, lines = 1, className, style }) {
  if (variant === "text" && lines > 1) {
    return (
      <span className={cx("fs-skeleton-group", className)} aria-hidden="true" style={style}>
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className="fs-skeleton fs-skeleton--text"
            style={{ width: index === lines - 1 ? "60%" : width }}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className={cx("fs-skeleton", `fs-skeleton--${variant}`, className)}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}

const dimension = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);

Skeleton.propTypes = {
  variant: PropTypes.oneOf(SKELETON_VARIANTS),
  width: dimension,
  height: dimension,
  lines: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Skeleton;
