/**
 * Estimates calories burned based on workout metrics.
 * Uses a simplified MET-based formula tuned for light arm swings.
 *
 * MET for light arm exercise ≈ 3.5
 * Calories = MET * weight_kg * duration_hours
 * Default weight assumption: 70kg
 */
const DEFAULT_WEIGHT_KG = 70;
const MET_ARM_SWING = 3.5;

/**
 * @param {number} durationSeconds - total game play time
 * @param {number} swingCount - number of large arm swings detected
 * @param {number} weightKg - user weight in kg (optional)
 * @returns {number} estimated calories burned (rounded)
 */
export function estimateCalories(durationSeconds, swingCount, weightKg = DEFAULT_WEIGHT_KG) {
  const hours = durationSeconds / 3600;
  // Base MET calories
  const base = MET_ARM_SWING * weightKg * hours;
  // Bonus for extra swings (each big swing adds ~0.05 kcal)
  const swingBonus = swingCount * 0.05;
  return Math.round(base + swingBonus);
}

/**
 * Returns a short intensity label based on slices per minute.
 */
export function getIntensityLabel(slices, durationSeconds) {
  if (durationSeconds === 0) return 'Warm Up';
  const spm = (slices / durationSeconds) * 60;
  if (spm >= 40) return '🔥 Intense';
  if (spm >= 20) return '💪 Moderate';
  return '🌿 Light';
}
