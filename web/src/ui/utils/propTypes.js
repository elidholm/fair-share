import PropTypes from "prop-types";

// React 19 passes `ref` as a regular prop to function components.
export const refPropType = PropTypes.oneOfType([
  PropTypes.func,
  PropTypes.shape({ current: PropTypes.any }),
]);
