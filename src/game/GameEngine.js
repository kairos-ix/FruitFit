import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { FruitSpawner } from './FruitSpawner.js';
import { SliceDetector } from './SliceDetector.js';
import { MotionTrail } from './MotionTrail.js';
import { createJuiceSplash, createScoreParticles } from './Particle.js';

const GRAVITY = 700; // px/s²
// Score per combo tier
const COMBO_SCORES = [0, 10, 20, 35, 50, 75, 100];

/**
 * Core game engine. Instantiated once and stored in a React ref.
 * Decoupled from React — communicates via callbacks.
 *
 * @param {Object} callbacks
 *   onScore(points, combo)   — called when a fruit is sliced
 *   onCombo(combo)           — called when combo increases
 *   onMiss()                 — called when a fruit falls off-screen
 *   onBombHit()              — called when a bomb is sliced
 *   onSlice(isBigSwing)      — called for every successful slice
 */
export class GameEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.fruits = [];
    this.particles = [];
    this.trail = new MotionTrail();
    this.spawner = new FruitSpawner();
    this.detector = new SliceDetector();
    this.elapsed = 0;     // total ms
    this.combo = 0;
    this.comboTimer = 0;  // ms since last slice (combo resets after 1500ms)
    this.W = window.innerWidth;
    this.H = window.innerHeight;
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
  }

  /**
   * Called every frame with delta (ms) and hand tracking data.
   * @param {number} delta
   * @param {Object} handData - from useHandTracker
   */
  update(delta, handData) {
    this.elapsed += delta;

    // --- Combo timer ---
    if (this.combo > 0) {
      this.comboTimer += delta;
      if (this.comboTimer > 1500) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    // --- Spawn ---
    const newEntities = this.spawner.update(delta, this.W, this.H, this.elapsed);
    this.fruits.push(...newEntities);

    // --- Update entities ---
    for (const f of this.fruits) f.update(delta, GRAVITY);

    // --- Slice detection ---
    if (handData?.handVisible) {
      const { sliced } = this.detector.detect(this.fruits, handData, this.W, this.H);

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
    }

    // --- Update particles ---
    for (const p of this.particles) p.update(delta);
    this.particles = this.particles.filter((p) => !p.isDead());

    // --- Check misses ---
    const missedFruits = this.fruits.filter(
      (f) => f instanceof Fruit && f.state === 'flying' && f.isOffScreen(this.W, this.H)
    );
    for (const f of missedFruits) {
      f.state = 'missed';
      this.callbacks.onMiss?.();
    }

    // --- Remove off-screen entities ---
    this.fruits = this.fruits.filter((f) => !f.isOffScreen(this.W, this.H));

    // --- Update motion trail ---
    if (handData?.handVisible) {
      this.trail.addPoint(handData.tipX * this.W, handData.tipY * this.H, true);
    } else {
      this.trail.addPoint(-1, -1, false);
    }
  }

  /**
   * Renders the entire game layer onto the canvas context.
   * Call after update().
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const { W, H } = this;
    ctx.clearRect(0, 0, W, H);

    // Draw fruits and bombs
    for (const f of this.fruits) f.draw(ctx);

    // Draw particles on top
    for (const p of this.particles) p.draw(ctx);

    // Draw motion trail on top of everything
    this.trail.draw(ctx);
  }
}
