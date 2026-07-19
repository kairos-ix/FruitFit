import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { FruitSpawner } from './FruitSpawner.js';
import { SliceDetector } from './SliceDetector.js';
import { MotionTrail } from './MotionTrail.js';
import { createJuiceSplash, createScoreParticles } from './Particle.js';

const GRAVITY = 700;
const COMBO_SCORES = [0, 10, 20, 35, 50, 75, 100];

/**
 * Core game engine. Decoupled from React — communicates via callbacks.
 *
 * Key design: NO extra smoothing/interpolation on top of the hand tracker.
 * The tracker already provides low-latency coordinates.
 * We just track prev vs current position for slice detection.
 */
export class GameEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.fruits = [];
    this.particles = [];
    this.trail = new MotionTrail();
    this.spawner = new FruitSpawner();
    this.detector = new SliceDetector();
    this.elapsed = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastDelta = 16;
    this.W = window.innerWidth;
    this.H = window.innerHeight;

    // Previous frame's tip position (normalized 0-1)
    this._prevTipX = -1;
    this._prevTipY = -1;
  }

  resize(W, H) {
    this.W = W;
    this.H = H;
  }

  reset() {
    this.fruits = [];
    this.particles = [];
    this.trail.clear();
    this.spawner.reset();
    this.elapsed = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this._prevTipX = -1;
    this._prevTipY = -1;
  }

  update(delta, handData) {
    this.elapsed += delta;
    this.lastDelta = delta;

    if (this.combo > 0) {
      this.comboTimer += delta;
      if (this.comboTimer > 1500) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    const newEntities = this.spawner.update(delta, this.W, this.H, this.elapsed);
    this.fruits.push(...newEntities);

    for (const f of this.fruits) f.update(delta, GRAVITY);

    if (handData?.handVisible && handData.tipX !== -1) {
      const tipX = handData.tipX;
      const tipY = handData.tipY;

      // On first frame, initialize prev to current so we don't get a giant jump
      if (this._prevTipX === -1) {
        this._prevTipX = tipX;
        this._prevTipY = tipY;
      }

      // Build hand data for slice detection with correct prev/current
      const sliceData = {
        tipX: tipX,
        tipY: tipY,
        prevTipX: this._prevTipX,
        prevTipY: this._prevTipY,
        velocity: handData.velocity,
        handVisible: true,
      };

      const { sliced } = this.detector.detect(this.fruits, sliceData, this.W, this.H);

      for (const entity of sliced) {
        if (entity instanceof Bomb) {
          entity.explode();
          this.combo = 0;
          this.comboTimer = 0;
          this.particles.push(...createJuiceSplash(entity.x, entity.y, '#ff4500', 20, 280));
          this.callbacks.onBombHit?.();
        } else if (entity instanceof Fruit) {
          entity.slice();
          this.combo += 1;
          this.comboTimer = 0;
          const tier = Math.min(this.combo - 1, COMBO_SCORES.length - 1);
          const bonus = COMBO_SCORES[tier];
          const points = entity.score + bonus;
          this.particles.push(...createJuiceSplash(entity.x, entity.y, entity.type.juiceColor, 20, 380));
          if (this.combo >= 3) {
            this.particles.push(...createScoreParticles(entity.x, entity.y));
          }
          this.callbacks.onScore?.(points, this.combo);
          this.callbacks.onCombo?.(this.combo);
          this.callbacks.onSlice?.(handData.isLargeSwing);
        }
      }

      // Add point to trail for rendering
      this.trail.addPoint(tipX * this.W, tipY * this.H, true, handData.velocity);

      // Store current as previous for next frame
      this._prevTipX = tipX;
      this._prevTipY = tipY;
    } else {
      this.trail.addPoint(-1, -1, false, 0);
      this._prevTipX = -1;
      this._prevTipY = -1;
    }

    for (const p of this.particles) p.update(delta);
    this.particles = this.particles.filter((p) => !p.isDead());

    const missedFruits = this.fruits.filter(
      (f) => f instanceof Fruit && f.state === 'flying' && f.isOffScreen(this.W, this.H)
    );
    for (const f of missedFruits) {
      f.state = 'missed';
      this.callbacks.onMiss?.();
    }

    this.fruits = this.fruits.filter((f) => !f.isOffScreen(this.W, this.H));
  }

  render(ctx) {
    const { W, H } = this;
    ctx.clearRect(0, 0, W, H);

    for (const f of this.fruits) f.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    this.trail.draw(ctx, this.lastDelta);
  }
}
