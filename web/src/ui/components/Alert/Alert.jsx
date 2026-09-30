import React from "react";
import PropTypes from "prop-types";
import { AlertOctagon, AlertTriangle, CheckCircle, Info, X } from "react-feather";
import IconButton from "../IconButton/IconButton.jsx";
import { cx } from "../../utils/cx.js";
import "./Alert.scss";

export const ALERT_TONES = ["info", "success", "warning", "error"];

const ICONS = { info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertOctagon };

/**
 * Inline feedback message covering the four kinds of feedback: status (info),
 * completion (success), warning and error. Errors use role="alert"
 * (assertive); everything else is a polite role="status".
 */
function Alert({ tone = "info", title, children, action, onDismiss, dismissLabel = "Dismiss", className, ...rest }) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("fs-alert", `fs-alert--${tone}`, className)}
      {...rest}
    >
      <Icon className="fs-alert__icon" aria-hidden="true" />
      <div className="fs-alert__body">
        {title && <p className="fs-alert__title">{title}</p>}
        {children && <div className="fs-alert__message">{children}</div>}
      </div>
      {action && <div className="fs-alert__action">{action}</div>}
      {onDismiss && (
        <IconButton label={dismissLabel} size="sm" onClick={onDismiss} className="fs-alert__dismiss">
          <X />
        </IconButton>
      )}
    </div>
  );
}

Alert.propTypes = {
  tone: PropTypes.oneOf(ALERT_TONES),
  title: PropTypes.node,
  children: PropTypes.node,
  action: PropTypes.node,
  onDismiss: PropTypes.func,
  dismissLabel: PropTypes.string,
  className: PropTypes.string,
};

export default Alert;
