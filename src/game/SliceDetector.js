import { segmentIntersectsCircle, vecLen, clamp } from '../utils/geometry.js';

// Minimum fingertip speed (normalized units/frame) to register a slice
const MIN_SPEED = 0.005;
// Minimum distance traveled between frames to register a slice
const MIN_DISTANCE = 0.004;

// Velocity-based hit expansion
// At high velocity the effective radius grows, making fast swipes more forgiving
const HIT_EXPANSION_FACTOR = 300;
const MAX_HIT_EXPANSION = 8;

/**
 * Path-based slice detection with multi-segment trail and velocity-expanded hitboxes.
 *
 * Converts normalized tip positions (0-1) to canvas pixels and checks
 * whether any movement segment in the trail intersects each fruit/bomb circle.
 */
export class SliceDetector {
  constructor() {
    // Track which entity IDs were already sliced to prevent double-hits
    // within the same trail sweep
    this._slicedThisFrame = new Set();
  }

  /**
   * @param {Array} entities - array of Fruit or Bomb instances
   * @param {Object} handData - { tipX, tipY, prevTipX, prevTipY, velocity, handVisible, trailHistory }
   * @param {number} W - canvas width
   * @param {number} H - canvas height
   * @returns {{ sliced: Array }}
   *    sliced = entities that were sliced this frame
   */
  detect(entities, handData, W, H) {
    const { tipX, tipY, prevTipX, prevTipY, velocity, handVisible, trailHistory } = handData;
    const sliced = [];
    this._slicedThisFrame.clear();

    // Speed gate — don't register a slice if the hand is barely moving or not visible.
    // We use the 60fps-smoothed 'velocity' which accurately reflects cursor speed.
    if (!handVisible || velocity < MIN_SPEED) return { sliced };

    // We only use the current frame's movement delta for slicing.
    // Using the full trail history creates a "laser wall" that unfairly kills fruits after the finger has passed.
    const segments = [
      {
        ax: prevTipX * W,
        ay: prevTipY * H,
        bx: tipX * W,
        by: tipY * H,
      }
    ];

    // Velocity-based hit radius expansion
    const expansion = clamp(velocity * HIT_EXPANSION_FACTOR, 0, MAX_HIT_EXPANSION);

    for (const entity of entities) {
      if (entity.state !== 'flying') continue;
      if (this._slicedThisFrame.has(entity.id)) continue;

      const effectiveRadius = entity.radius + expansion;

      // Check all segments — catches fast swipes that skip over the fruit
      for (const seg of segments) {
        if (segmentIntersectsCircle(seg.ax, seg.ay, seg.bx, seg.by, entity.x, entity.y, effectiveRadius)) {
          sliced.push(entity);
          this._slicedThisFrame.add(entity.id);
          break; // no need to check more segments for this entity
        }
      }
    }

    return { sliced };
  }
}
