import React, { useId } from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import "./TextField.scss";

/**
 * Labelled text input with hint, inline validation and optional affixes.
 * Any unknown prop (type, value, onChange, inputMode, autoComplete…) is passed
 * to the underlying <input>. Errors are wired via aria-invalid and
 * aria-describedby, and announced politely as they appear.
 */
function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  prefix,
  suffix,
  id,
  required = false,
  disabled = false,
  className,
  inputClassName,
  "aria-describedby": describedByProp,
  ref,
  ...inputProps
}) {
  const autoId = useId();
  const inputId = id ?? `fs-field-${autoId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = cx(describedByProp, hint && hintId, error && errorId) || undefined;

  return (
    <div
      className={cx(
        "fs-field",
        error && "fs-field--invalid",
        disabled && "fs-field--disabled",
        className,
      )}
    >
      <label htmlFor={inputId} className={cx("fs-field__label", hideLabel && "fs-visually-hidden")}>
        {label}
        {required && <span className="fs-field__required" aria-hidden="true"> *</span>}
      </label>
      <div className="fs-field__control">
        {prefix && <span className="fs-field__affix">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cx("fs-field__input", inputClassName)}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {suffix && <span className="fs-field__affix">{suffix}</span>}
      </div>
      {hint && <p id={hintId} className="fs-field__hint">{hint}</p>}
      <p id={errorId} className="fs-field__error" aria-live="polite">
        {error}
      </p>
    </div>
  );
}

TextField.propTypes = {
  label: PropTypes.node.isRequired,
  hideLabel: PropTypes.bool,
  hint: PropTypes.node,
  error: PropTypes.node,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  id: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  "aria-describedby": PropTypes.string,
  ref: refPropType,
};

export default TextField;
