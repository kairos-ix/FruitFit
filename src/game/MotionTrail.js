import { catmullRomPoint, clamp } from '../utils/geometry.js';

const MAX_POINTS = 32;
const SPLINE_SUBDIVISIONS = 4; // sub-segments per trail segment for smooth curves

/**
 * Tracks the last N fingertip positions and renders a smooth, velocity-responsive
 * motion trail using Catmull-Rom spline interpolation.
 */
export class MotionTrail {
  constructor() {
    this.points = []; // { x, y } in canvas pixels
    this.velocity = 0; // current normalized velocity
    this.pulsePhase = 0; // for fingertip cursor pulse animation
  }

  /**
   * @param {number} x - canvas x
   * @param {number} y - canvas y
   * @param {boolean} visible - whether the hand is in frame
   * @param {number} velocity - normalized velocity (0..1 range typically)
   */
  addPoint(x, y, visible, velocity = 0) {
    this.velocity = velocity;
    if (!visible || x < 0 || y < 0) {
      // Fade out gradually instead of instant clear
      if (this.points.length > 0) {
        this.points.splice(0, Math.max(1, Math.floor(this.points.length * 0.3)));
      }
      return;
    }
    this.points.push({ x, y });
    if (this.points.length > MAX_POINTS) {
      this.points.shift();
    }
  }

  draw(ctx, deltaMs = 16) {
    const n = this.points.length;
    if (n < 2) return;

    // Advance pulse animation
    this.pulsePhase += (deltaMs / 1000) * 4;

    // Velocity factor: 0 = still, 1 = very fast
    const velFactor = clamp(this.velocity / 0.04, 0, 1);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // --- Secondary "afterglow" trail (rendered first, underneath) ---
    if (n >= 3 && velFactor > 0.15) {
      this._drawSplineTrail(ctx, n, velFactor, true);
    }

    // --- Primary trail ---
    this._drawSplineTrail(ctx, n, velFactor, false);

    // --- Fingertip cursor ---
    this._drawCursor(ctx, n, velFactor);

    ctx.restore();
  }

  /**
   * Draws the trail using Catmull-Rom spline interpolation for smooth curves.
   * @param {boolean} isGlow - if true, renders the secondary afterglow layer
   */
  _drawSplineTrail(ctx, n, velFactor, isGlow) {
    // For each segment between points[i] and points[i+1],
    // use surrounding points as Catmull-Rom control points
    for (let i = 0; i < n - 1; i++) {
      const p0 = this.points[Math.max(0, i - 1)];
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const p3 = this.points[Math.min(n - 1, i + 2)];

      const segT = (i + 0.5) / (n - 1); // 0 = oldest, 1 = newest

      for (let s = 0; s < SPLINE_SUBDIVISIONS; s++) {
        const t0 = s / SPLINE_SUBDIVISIONS;
        const t1 = (s + 1) / SPLINE_SUBDIVISIONS;

        const pt0 = catmullRomPoint(p0, p1, p2, p3, t0);
        const pt1 = catmullRomPoint(p0, p1, p2, p3, t1);

        // Interpolated progress along the full trail
        const progress = segT + (t0 + t1) * 0.5 / (n - 1);

        if (isGlow) {
          // Afterglow: wider, more transparent, shifted hue
          const alpha = progress * progress * 0.3 * velFactor;
          const width = (4 + progress * 20) * (1 + velFactor * 0.5);

          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `hsl(${270 + progress * 50}, 100%, ${55 + progress * 25}%)`;
          ctx.lineWidth = width + 6;
        } else {
          // Primary trail
          const alpha = progress * progress * 0.9;
          const baseWidth = 2 + progress * 12;
          const width = baseWidth * (1 + velFactor * 0.6);

          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `hsl(${195 + progress * 60}, 100%, ${55 + progress * 25}%)`;
          ctx.lineWidth = width;
        }

        ctx.beginPath();
        ctx.moveTo(pt0.x, pt0.y);
        ctx.lineTo(pt1.x, pt1.y);
        ctx.stroke();
      }
    }
  }

  _drawCursor(ctx, n, velFactor) {
    const tip = this.points[n - 1];
    ctx.globalAlpha = 1;

    // Pulse animation
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;

    // Size reacts to velocity
    const baseRadius = 18 + velFactor * 10;
    const outerRadius = baseRadius * pulse;
    const innerRadius = (5 + velFactor * 4) * pulse;

    // Outer glow — larger and more intense during fast motion
    ctx.shadowColor = velFactor > 0.3 ? '#ff66ff' : '#00eaff';
    ctx.shadowBlur = 18 + velFactor * 20;
    ctx.fillStyle = velFactor > 0.3
      ? `rgba(255,102,255,${0.2 + velFactor * 0.15})`
      : `rgba(0,234,255,${0.2 + velFactor * 0.1})`;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Middle ring (velocity indicator)
    if (velFactor > 0.1) {
      ctx.shadowBlur = 8;
      ctx.strokeStyle = `rgba(255,255,255,${0.3 + velFactor * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, outerRadius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner dot
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8 + velFactor * 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  clear() {
    this.points = [];
    this.velocity = 0;
  }
}
