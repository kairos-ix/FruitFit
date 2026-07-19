import { segmentIntersectsCircle, vecLen } from '../utils/geometry.js';

// Minimum fingertip speed (normalized units/frame) to register a slice
const MIN_SPEED = 0.008;
// Minimum distance traveled between frames to register a slice
const MIN_DISTANCE = 0.006;

/**
 * Path-based slice detection.
 *
 * Converts normalized tip positions (0-1) to canvas pixels and checks
 * whether the movement segment intersects each fruit/bomb circle.
 */
export class SliceDetector {
  /**
   * @param {Array} entities - array of Fruit or Bomb instances
   * @param {Object} handData - { tipX, tipY, prevTipX, prevTipY, velocity, isLargeSwing }
   * @param {number} W - canvas width
   * @param {number} H - canvas height
   * @returns {{ sliced: Array, missed: Array }}
   *    sliced = entities that were sliced this frame
   *    missed = entities that went off-screen (for life deduction)
   */
  detect(entities, handData, W, H) {
    const { tipX, tipY, prevTipX, prevTipY, velocity, handVisible } = handData;
    const sliced = [];

    // Speed gate — don't register a slice if the hand is barely moving
    if (!handVisible || velocity < MIN_SPEED) return { sliced };

    const dist = vecLen(tipX - prevTipX, tipY - prevTipY);
    if (dist < MIN_DISTANCE) return { sliced };

    // Convert normalized coords to canvas pixels
    const ax = prevTipX * W;
    const ay = prevTipY * H;
    const bx = tipX * W;
    const by = tipY * H;

    for (const entity of entities) {
      if (entity.state !== 'flying') continue;
      if (segmentIntersectsCircle(ax, ay, bx, by, entity.x, entity.y, entity.radius)) {
        sliced.push(entity);
      }
    }

    return { sliced };
  }
}
