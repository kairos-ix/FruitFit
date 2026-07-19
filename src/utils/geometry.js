/**
 * Geometry utilities for FruitFit slice detection.
 */

/**
 * Returns the minimum distance from point P to segment AB.
 */
export function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Returns true if the segment AB intersects the circle at (cx, cy) with radius r.
 */
export function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
  const dist = pointToSegmentDistance(cx, cy, ax, ay, bx, by);
  return dist <= r;
}

/**
 * Returns the length of a 2D vector.
 */
export function vecLen(dx, dy) {
  return Math.hypot(dx, dy);
}

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 */
export function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Linearly interpolates between a and b by t.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamps value between min and max.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
