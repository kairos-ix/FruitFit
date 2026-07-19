import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { FruitSpawner } from './FruitSpawner.js';
import { SliceDetector } from './SliceDetector.js';
import { MotionTrail } from './MotionTrail.js';
import { createJuiceSplash, createScoreParticles } from './Particle.js';

const GRAVITY = 700;
const COMBO_SCORES = [0, 10, 20, 35, 50, 75, 100];

/**
 * Core game engine. Instantiated once and stored in a React ref.
 * Decoupled from React — communicates via callbacks.
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

    // Frame-interpolation state for smooth trail between camera frames
    this._lastHandFrameId = -1;
    this._interpX = -1;
    this._interpY = -1;
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
    this._lastHandFrameId = -1;
    this._interpX = -1;
    this._interpY = -1;
  }

  /**
   * Called every frame with delta (ms) and hand tracking data.
   * Hand data updates at ~30fps (camera rate), but this runs at 60fps.
   * We interpolate the cursor position between camera frames for smooth trail.
   */
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

    if (handData?.handVisible) {
      const isNewCameraFrame = handData._frameId !== this._lastHandFrameId;

      if (isNewCameraFrame) {
        this._lastHandFrameId = handData._frameId;
        this._interpX = handData.tipX;
        this._interpY = handData.tipY;
      } else {
        // Between camera frames: glide toward current position using velocity
        this._interpX += handData.velX * 0.5;
        this._interpY += handData.velY * 0.5;
      }

      // Use interpolated position for slice detection
      const interpHandData = {
        ...handData,
        tipX: this._interpX,
        tipY: this._interpY,
      };

      const { sliced } = this.detector.detect(this.fruits, interpHandData, this.W, this.H);

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

      // Add interpolated point to trail every frame for silky-smooth rendering
      this.trail.addPoint(
        this._interpX * this.W,
        this._interpY * this.H,
        true,
        handData.velocity
      );
    } else {
      this.trail.addPoint(-1, -1, false, 0);
      this._interpX = -1;
      this._interpY = -1;
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
