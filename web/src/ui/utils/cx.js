/**
 * Joins truthy class names: cx("a", cond && "b", undefined) → "a b".
 * @param {...(string|false|null|undefined)} parts
 * @returns {string}
 */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
