import React from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import "./IconButton.scss";

export const ICON_BUTTON_VARIANTS = ["secondary", "tinted", "plain", "destructive"];
export const ICON_BUTTON_SIZES = ["sm", "md"];

/**
 * Icon-only button. `label` is required and becomes the accessible name (and
 * tooltip), because an icon alone is not an accessible label. Small buttons
 * keep a 44px invisible hit area.
 */
function IconButton({
  label,
  variant = "plain",
  size = "md",
  type = "button",
  showTooltip = true,
  className,
  children,
  ref,
  ...rest
}) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={showTooltip ? label : undefined}
      className={cx("fs-icon-button", `fs-icon-button--${variant}`, `fs-icon-button--${size}`, className)}
      {...rest}
    >
      <span className="fs-icon-button__icon" aria-hidden="true">{children}</span>
    </button>
  );
}

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(ICON_BUTTON_VARIANTS),
  size: PropTypes.oneOf(ICON_BUTTON_SIZES),
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  showTooltip: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  ref: refPropType,
};

export default IconButton;
