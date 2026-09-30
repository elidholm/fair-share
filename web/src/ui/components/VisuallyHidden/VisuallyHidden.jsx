import React from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";

/** Content available to assistive tech but not rendered visually. */
function VisuallyHidden({ as: Component = "span", className, children, ...rest }) {
  return (
    <Component className={cx("fs-visually-hidden", className)} {...rest}>
      {children}
    </Component>
  );
}

VisuallyHidden.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default VisuallyHidden;
