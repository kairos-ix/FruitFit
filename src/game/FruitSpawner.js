import { FRUIT_TYPES } from './Fruit.js';
import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { randBetween } from '../utils/geometry.js';

// Base interval between spawns in ms
const BASE_INTERVAL = 1400;
// Minimum interval (difficulty cap) in ms
const MIN_INTERVAL = 550;
// Probability of spawning a bomb (0-1)
const BOMB_CHANCE = 0.12;
// Gravity in px/s² (must match GameEngine)
const GRAVITY = 700;

/**
 * Calculates the initial vertical velocity needed to reach a given apex height.
 * Using: 0 = vy² - 2*g*h => vy = sqrt(2*g*h)
 */
function vyForApex(apexY, startY) {
  const h = startY - apexY;
  if (h <= 0) return -200;
  return -Math.sqrt(2 * GRAVITY * h);
}

export class FruitSpawner {
  constructor() {
    this.elapsed = 0;
    this.nextSpawn = 500; // first spawn after 500ms
  }

  /**
   * @param {number} delta - ms since last frame
   * @param {number} W - canvas width
   * @param {number} H - canvas height
   * @param {number} totalElapsed - total game elapsed ms
   * @returns {Array} - new entities (Fruit or Bomb) to add
   */
  update(delta, W, H, totalElapsed) {
    this.elapsed += delta;
    if (this.elapsed < this.nextSpawn) return [];

    this.elapsed = 0;

    // Ramp difficulty: interval shrinks over first 2 minutes
    const t = Math.min(totalElapsed / 120000, 1);
    const interval = BASE_INTERVAL - (BASE_INTERVAL - MIN_INTERVAL) * t;
    this.nextSpawn = interval + randBetween(-150, 150);

    // Decide how many to spawn (1 or 2 at a time, more at high difficulty)
    const count = Math.random() < 0.3 + t * 0.4 ? 2 : 1;
    const entities = [];

    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < BOMB_CHANCE;
      entities.push(isBomb ? this._spawnBomb(W, H) : this._spawnFruit(W, H));
    }

    return entities;
  }

  _spawnFruit(W, H) {
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    return this._spawnEntity(W, H, (x, y, vx, vy) => new Fruit(x, y, vx, vy, type));
  }

  _spawnBomb(W, H) {
    return this._spawnEntity(W, H, (x, y, vx, vy) => new Bomb(x, y, vx, vy));
  }

  _spawnEntity(W, H, factory) {
    const margin = 60;
    // Spawn from left side or right side
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? randBetween(-margin, margin) : randBetween(W - margin, W + margin);

    // Horizontal start from bottom
    const startY = H + 40;

    // Target X somewhere in the middle-ish of the screen
    const targetX = randBetween(W * 0.15, W * 0.85);

    // Arc apex: somewhere between 15% and 55% of screen height from top
    const apexY = randBetween(H * 0.15, H * 0.55);

    // Time to reach apex using vy = vyForApex
    const vy = vyForApex(apexY, startY);

    // Horizontal velocity to cross from startX to targetX in roughly time-to-apex * 2
    const timeOfFlight = (-2 * vy) / GRAVITY; // seconds
    const vx = (targetX - startX) / Math.max(timeOfFlight, 0.5);

    return factory(startX, startY, vx, vy);
  }

  reset() {
    this.elapsed = 0;
    this.nextSpawn = 500;
  }
}
