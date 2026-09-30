import React from "react";
import PropTypes from "prop-types";
import { cx } from "../../utils/cx.js";
import { refPropType } from "../../utils/propTypes.js";
import "./Card.scss";

export const CARD_MATERIALS = ["thin", "regular", "thick", "solid"];
export const CARD_PADDINGS = ["none", "sm", "md", "lg"];

/**
 * Surface container. `material` sets translucency/weight (thicker = more
 * structural). Use `as` for semantics (section, article, li…).
 * `interactive` adds hover/press feedback — pair it with a clickable `as`
 * (e.g. "button" or a router Link) rather than an onClick on a div.
 */
function Card({
  as: Component = "div",
  material = "regular",
  padding = "md",
  interactive = false,
  className,
  children,
  ref,
  ...rest
}) {
  return (
    <Component
      ref={ref}
      className={cx(
        "fs-card",
        `fs-card--${material}`,
        `fs-card--pad-${padding}`,
        interactive && "fs-card--interactive",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

Card.propTypes = {
  as: PropTypes.elementType,
  material: PropTypes.oneOf(CARD_MATERIALS),
  padding: PropTypes.oneOf(CARD_PADDINGS),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  ref: refPropType,
};

export default Card;
