import React from "react";
import PropTypes from "prop-types";
import VisuallyHidden from "../VisuallyHidden/VisuallyHidden.jsx";
import { cx } from "../../utils/cx.js";
import "./Spinner.scss";

export const SPINNER_SIZES = ["sm", "md", "lg"];

/**
 * Indeterminate activity indicator. With `label` it becomes a polite live
 * status; without one it is decorative (use inside a component that already
 * communicates busy state, e.g. a loading Button).
 */
function Spinner({ size = "md", label, className }) {
  const a11y = label ? { role: "status" } : { "aria-hidden": true };
  return (
    <span className={cx("fs-spinner", `fs-spinner--${size}`, className)} {...a11y}>
      <svg className="fs-spinner__svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <circle className="fs-spinner__track" cx="12" cy="12" r="9" />
        <circle className="fs-spinner__arc" cx="12" cy="12" r="9" />
      </svg>
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
    </span>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(SPINNER_SIZES),
  label: PropTypes.string,
  className: PropTypes.string,
};

export default Spinner;
