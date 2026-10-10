import {SMASH} from './characters.js';

export const PAPER_RELIEF = 2.5;
export const SMASH_FILL_MULTIPLIER = .35;
export const VISUAL_STAIN_START = 15;
export const VISUAL_LEAK_START = 20;

export function fillRate(tuning, elapsed, power) {
 const base = tuning.meterRate + Math.min(tuning.meterExtra, elapsed * tuning.meterRamp);
 return base * (SMASH.has(power) ? SMASH_FILL_MULTIPLIER : 1);
}

// Cosmetic only: paper relief and gameplay difficulty still use the real meter.
export function visualPressure(meter, elapsed=0) {
 const timed = elapsed < 20 ? 0 : Math.min(100, 84 + (elapsed - 20) * 1.6);
 return Math.max(meter, timed);
}
