import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "../Button/Button.jsx";
import "../Button/Button.scss";

/** A button-shaped router link that retains native link semantics. */
function LinkButton({
  to,
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconStart,
  iconEnd,
  className,
  children,
  ref,
  ...rest
}) {
  return (
    <Link
      ref={ref}
      to={to}
      className={cx(
        "fs-button",
        "fs-link-button",
        `fs-button--${variant}`,
        `fs-button--${size}`,
        fullWidth && "fs-button--full-width",
        className,
      )}
      {...rest}
    >
      <span className="fs-button__content">
        {iconStart && <span className="fs-button__icon" aria-hidden="true">{iconStart}</span>}
        {children != null && <span className="fs-button__label">{children}</span>}
        {iconEnd && <span className="fs-button__icon" aria-hidden="true">{iconEnd}</span>}
      </span>
    </Link>
  );
}

LinkButton.propTypes = {
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
  fullWidth: PropTypes.bool,
  iconStart: PropTypes.node,
  iconEnd: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
  ref: refPropType,
};

export default LinkButton;
