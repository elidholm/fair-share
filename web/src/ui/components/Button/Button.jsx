import React from "react";
import PropTypes from "prop-types";
import Spinner from "../Spinner/Spinner.jsx";
import VisuallyHidden from "../VisuallyHidden/VisuallyHidden.jsx";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import "./Button.scss";

export const BUTTON_VARIANTS = ["primary", "secondary", "tinted", "plain", "destructive"];
export const BUTTON_SIZES = ["sm", "md", "lg"];

/**
 * Text button. While `loading`, it stays focusable (aria-disabled rather than
 * disabled, so keyboard focus is not lost), ignores activation, and keeps its
 * width so the layout doesn't jump.
 */
function Button({
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  loadingLabel = "Loading",
  disabled = false,
  fullWidth = false,
  iconStart,
  iconEnd,
  onClick,
  className,
  children,
  ref,
  ...rest
}) {
  function handleClick(event) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      className={cx(
        "fs-button",
        `fs-button--${variant}`,
        `fs-button--${size}`,
        fullWidth && "fs-button--full-width",
        loading && "fs-button--loading",
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      <span className="fs-button__content">
        {iconStart && <span className="fs-button__icon" aria-hidden="true">{iconStart}</span>}
        {children != null && <span className="fs-button__label">{children}</span>}
        {iconEnd && <span className="fs-button__icon" aria-hidden="true">{iconEnd}</span>}
      </span>
      {loading && (
        <span className="fs-button__spinner">
          <Spinner size="sm" />
          <VisuallyHidden>{loadingLabel}</VisuallyHidden>
        </span>
      )}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  loading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  iconStart: PropTypes.node,
  iconEnd: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  ref: refPropType,
};

export default Button;
