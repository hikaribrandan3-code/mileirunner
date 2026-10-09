import {SMASH} from './characters.js';

export const PAPER_RELIEF = 2.5;
export const SMASH_FILL_MULTIPLIER = .35;
export const VISUAL_STAIN_START = 15;
export const VISUAL_LEAK_START = 20;

export function fillRate(tuning, elapsed, power) {
 const base = tuning.meterRate + Math.min(tuning.meterExtra, elapsed * tuning.meterRamp);
 return base * (SMASH.has(power) ? SMASH_FILL_MULTIPLIER : 1);
}
