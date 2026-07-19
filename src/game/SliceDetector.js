import { segmentIntersectsCircle, clamp } from '../utils/geometry.js';

// Minimum fingertip speed (normalized units/frame) to register a slice
const MIN_SPEED = 0.002;

// Velocity-based hit expansion — makes fast swipes more forgiving
const HIT_EXPANSION_FACTOR = 400;
const MAX_HIT_EXPANSION = 15;

/**
 * Simple, reliable slice detection.
 * Takes the prev→current fingertip segment and checks if it crosses any fruit.
 */
export class SliceDetector {
  constructor() {
    this._slicedThisFrame = new Set();
  }

  detect(entities, handData, W, H) {
    const { tipX, tipY, prevTipX, prevTipY, velocity, handVisible } = handData;
    const sliced = [];
    this._slicedThisFrame.clear();

    if (!handVisible || velocity < MIN_SPEED) return { sliced };

    // Single segment: previous position → current position (in pixel space)
    const ax = prevTipX * W;
    const ay = prevTipY * H;
    const bx = tipX * W;
    const by = tipY * H;

    // Velocity-based hit radius expansion
    const expansion = clamp(velocity * HIT_EXPANSION_FACTOR, 0, MAX_HIT_EXPANSION);

    for (const entity of entities) {
      if (entity.state !== 'flying') continue;
      if (this._slicedThisFrame.has(entity.id)) continue;

      const effectiveRadius = entity.radius + expansion;

      if (segmentIntersectsCircle(ax, ay, bx, by, entity.x, entity.y, effectiveRadius)) {
        sliced.push(entity);
        this._slicedThisFrame.add(entity.id);
      }
    }

    return { sliced };
  }
}
