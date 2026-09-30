import React, { useId, useState } from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import "./Switch.scss";

/**
 * On/off switch (role="switch"). Works controlled (`checked` + `onChange`) or
 * uncontrolled (`defaultChecked`). Native <button> semantics give Space/Enter
 * activation and focus for free; the <label> is clickable too.
 * Pass `name` to participate in <form> submission.
 */
function Switch({
  label,
  hideLabel = false,
  description,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  name,
  value = "on",
  id,
  className,
  ref,
  ...rest
}) {
  const autoId = useId();
  const switchId = id ?? `fs-switch-${autoId}`;
  const descriptionId = `${switchId}-description`;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = isControlled ? checked : internalChecked;

  function handleClick(event) {
    const next = !isOn;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next, event);
  }

  return (
    <div className={cx("fs-switch-field", disabled && "fs-switch-field--disabled", className)}>
      <span className={cx("fs-switch-field__text", hideLabel && "fs-visually-hidden")}>
        <label htmlFor={switchId} className="fs-switch-field__label">{label}</label>
        {description && (
          <span id={descriptionId} className="fs-switch-field__description">{description}</span>
        )}
      </span>
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        className="fs-switch"
        onClick={handleClick}
        {...rest}
      >
        <span className="fs-switch__thumb" aria-hidden="true" />
      </button>
      {name && isOn && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

Switch.propTypes = {
  label: PropTypes.node.isRequired,
  hideLabel: PropTypes.bool,
  description: PropTypes.node,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  ref: refPropType,
};

export default Switch;
