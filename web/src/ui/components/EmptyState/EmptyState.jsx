import React from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import "./EmptyState.scss";

/**
 * Explains why there's no content and what to do next. Always offer the next
 * step via `actions` when one exists — an empty screen should never be a dead
 * end.
 */
function EmptyState({ icon, title, description, actions, headingLevel = 2, compact = false, className }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={cx("fs-empty", compact && "fs-empty--compact", className)}>
      {icon && <div className="fs-empty__icon" aria-hidden="true">{icon}</div>}
      <Heading className="fs-empty__title">{title}</Heading>
      {description && <p className="fs-empty__description">{description}</p>}
      {actions && <div className="fs-empty__actions">{actions}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  headingLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default EmptyState;
