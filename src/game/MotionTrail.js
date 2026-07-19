const MAX_POINTS = 24;

/**
 * Tracks the last N fingertip positions and renders a fading motion trail.
 */
export class MotionTrail {
  constructor() {
    this.points = []; // { x, y } in canvas pixels
  }

  /**
   * @param {number} x - canvas x
   * @param {number} y - canvas y
   * @param {boolean} visible - whether the hand is in frame
   */
  addPoint(x, y, visible) {
    if (!visible || x < 0 || y < 0) {
      this.points = [];
      return;
    }
    this.points.push({ x, y });
    if (this.points.length > MAX_POINTS) {
      this.points.shift();
    }
  }

  draw(ctx) {
    const n = this.points.length;
    if (n < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < n; i++) {
      const t = i / n; // 0 = oldest, 1 = newest
      const alpha = t * t;             // quadratic fade-in
      const width = 3 + t * 14;        // thin to thick

      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = `hsl(${195 + t * 60}, 100%, ${60 + t * 20}%)`;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
      ctx.lineTo(this.points[i].x, this.points[i].y);
      ctx.stroke();
    }

    // Draw the fingertip cursor
    const tip = this.points[n - 1];
    ctx.globalAlpha = 1;

    // Outer glow
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(0,234,255,0.25)';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Inner dot
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clear() {
    this.points = [];
  }
}
