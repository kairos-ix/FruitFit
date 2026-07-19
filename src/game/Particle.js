import { randBetween } from '../utils/geometry.js';

export class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.alpha = 1;
    this.radius = randBetween(3, 8);
    this.life = randBetween(0.4, 0.9); // seconds
    this.elapsed = 0;
  }

  update(delta) {
    const dt = delta / 1000;
    this.elapsed += dt;
    this.vy += 400 * dt; // gravity
    this.vx *= 0.98;     // air resistance
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha = Math.max(0, 1 - this.elapsed / this.life);
    this.radius *= 0.995;
  }

  isDead() {
    return this.alpha <= 0 || this.radius < 0.5;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Creates a juice splash burst of particles at (x, y).
 * @param {number} x
 * @param {number} y
 * @param {string} color - hex/rgb color
 * @param {number} count - number of particles
 * @param {number} speed - base speed in px/s
 * @returns {Particle[]}
 */
export function createJuiceSplash(x, y, color, count = 18, speed = 350) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = randBetween(0, Math.PI * 2);
    const s = randBetween(speed * 0.3, speed);
    particles.push(
      new Particle(
        x + randBetween(-8, 8),
        y + randBetween(-8, 8),
        color,
        Math.cos(angle) * s,
        Math.sin(angle) * s - randBetween(50, 150), // slight upward bias
      )
    );
  }
  return particles;
}

/**
 * Creates star / sparkle score particles at (x, y).
 */
export function createScoreParticles(x, y) {
  const colors = ['#ffe57f', '#fff9c4', '#ffffff', '#fffde7'];
  const particles = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    particles.push(
      new Particle(x, y, colors[i % colors.length], Math.cos(angle) * 120, Math.sin(angle) * 120 - 80)
    );
  }
  return particles;
}
