import { randBetween } from '../utils/geometry.js';

export const FRUIT_TYPES = [
  { id: 'watermelon', outerColor: '#2d8a3e', innerColor: '#e83d5c', radius: 42, score: 10, juiceColor: '#ff6b8a' },
  { id: 'apple',      outerColor: '#c0392b', innerColor: '#f5c6c6', radius: 30, score: 15, juiceColor: '#ffaaaa' },
  { id: 'orange',     outerColor: '#e67e22', innerColor: '#fde9c8', radius: 33, score: 12, juiceColor: '#ffd27a' },
  { id: 'strawberry', outerColor: '#e91e63', innerColor: '#ffd6e7', radius: 26, score: 20, juiceColor: '#ff80ab' },
  { id: 'pineapple',  outerColor: '#f9a825', innerColor: '#fff9c4', radius: 36, score: 8,  juiceColor: '#ffee58' },
  { id: 'lemon',      outerColor: '#cddc39', innerColor: '#f9fbe7', radius: 27, score: 15, juiceColor: '#dce775' },
  { id: 'grape',      outerColor: '#7b1fa2', innerColor: '#e1bee7', radius: 24, score: 25, juiceColor: '#ce93d8' },
];

let _id = 0;

export class Fruit {
  constructor(x, y, vx, vy, type) {
    this.id = _id++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.rotation = 0;
    this.rotSpeed = randBetween(-3, 3); // radians per second
    this.radius = type.radius;
    this.score = type.score;
    this.state = 'flying'; // 'flying' | 'sliced' | 'missed'

    // Sliced half state
    this.halfL = { x, y, vx: vx - 80, vy: vy - 30, rot: 0, rotSpeed: -2 };
    this.halfR = { x, y, vx: vx + 80, vy: vy - 30, rot: 0, rotSpeed: 2 };
    this.sliceAlpha = 1;
  }

  update(delta, gravity) {
    const dt = delta / 1000;
    if (this.state === 'flying') {
      this.vy += gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
    } else if (this.state === 'sliced') {
      const g = gravity * 0.6;
      this.halfL.vy += g * dt;
      this.halfR.vy += g * dt;
      this.halfL.x += this.halfL.vx * dt;
      this.halfL.y += this.halfL.vy * dt;
      this.halfR.x += this.halfR.vx * dt;
      this.halfR.y += this.halfR.vy * dt;
      this.halfL.rot += this.halfL.rotSpeed * dt;
      this.halfR.rot += this.halfR.rotSpeed * dt;
      this.sliceAlpha -= dt * 1.2;
    }
  }

  slice() {
    if (this.state !== 'flying') return false;
    this.state = 'sliced';
    this.halfL = {
      x: this.x, y: this.y,
      vx: this.vx - randBetween(60, 120),
      vy: this.vy - randBetween(20, 60),
      rot: this.rotation, rotSpeed: randBetween(-4, -1),
    };
    this.halfR = {
      x: this.x, y: this.y,
      vx: this.vx + randBetween(60, 120),
      vy: this.vy - randBetween(20, 60),
      rot: this.rotation, rotSpeed: randBetween(1, 4),
    };
    return true;
  }

  isOffScreen(W, H) {
    if (this.state === 'flying') return this.y > H + 80;
    return (
      this.sliceAlpha <= 0 ||
      (this.halfL.y > H + 100 && this.halfR.y > H + 100)
    );
  }

  /** Draw the fruit on a canvas context */
  draw(ctx) {
    if (this.state === 'flying') {
      this._drawWhole(ctx, this.x, this.y, this.rotation);
    } else if (this.state === 'sliced' && this.sliceAlpha > 0) {
      ctx.globalAlpha = Math.max(0, this.sliceAlpha);
      this._drawHalf(ctx, this.halfL, 'left');
      this._drawHalf(ctx, this.halfR, 'right');
      ctx.globalAlpha = 1;
    }
  }

  _drawWhole(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Outer circle
    const grad = ctx.createRadialGradient(-this.radius * 0.3, -this.radius * 0.3, 0, 0, 0, this.radius);
    grad.addColorStop(0, this._lighten(this.type.outerColor, 0.4));
    grad.addColorStop(1, this.type.outerColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Fruit-specific details
    this._drawDetails(ctx);

    // Highlight gloss
    const gloss = ctx.createRadialGradient(-this.radius * 0.35, -this.radius * 0.35, 0, -this.radius * 0.2, -this.radius * 0.2, this.radius * 0.55);
    gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawDetails(ctx) {
    const r = this.radius;
    switch (this.type.id) {
      case 'watermelon': {
        // Green rind stripes
        ctx.strokeStyle = '#1a5c2a';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * r * 0.28, -r * 0.95);
          ctx.bezierCurveTo(i * r * 0.28 + r * 0.1, 0, i * r * 0.28 + r * 0.1, 0, i * r * 0.28, r * 0.95);
          ctx.stroke();
        }
        break;
      }
      case 'apple': {
        // Stem
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(r * 0.3, -r * 1.3, r * 0.1, -r * 1.5);
        ctx.stroke();
        break;
      }
      case 'orange': {
        // Segments
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r);
          ctx.stroke();
        }
        break;
      }
      case 'strawberry': {
        // Seeds
        ctx.fillStyle = '#c62828';
        for (let i = 0; i < 6; i++) {
          const sx = Math.cos((i * Math.PI * 2) / 6) * r * 0.5;
          const sy = Math.sin((i * Math.PI * 2) / 6) * r * 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'grape': {
        // Shine dot
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default:
        break;
    }
  }

  _drawHalf(ctx, half, side) {
    ctx.save();
    ctx.translate(half.x, half.y);
    ctx.rotate(half.rot);

    const r = this.radius;
    const startAngle = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    const endAngle = side === 'left' ? (3 * Math.PI) / 2 : Math.PI / 2;

    // Flesh (inner color)
    ctx.fillStyle = this.type.innerColor;
    ctx.beginPath();
    ctx.arc(0, 0, r, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Outer skin
    const grad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
    grad.addColorStop(0, this._lighten(this.type.outerColor, 0.2));
    grad.addColorStop(1, this.type.outerColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Cut line highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();

    ctx.restore();
  }

  _lighten(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amount));
    const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amount));
    const b = Math.min(255, (n & 255) + Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  }
}
