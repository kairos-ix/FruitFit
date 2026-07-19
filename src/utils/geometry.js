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

/**
 * Catmull-Rom spline interpolation between four control points.
 * Returns the interpolated {x, y} at parameter t ∈ [0, 1] on the segment p1→p2.
 *
 * @param {{x:number,y:number}} p0
 * @param {{x:number,y:number}} p1
 * @param {{x:number,y:number}} p2
 * @param {{x:number,y:number}} p3
 * @param {number} t - 0..1
 * @returns {{x:number,y:number}}
 */
export function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}
