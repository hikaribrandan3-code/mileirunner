import {SHAPES} from './track.js';

// One obstacle contract for each ability. Pickups and supporting ramps/roofs
// are never targets. Hole objects are retired only by the chainsaw's clear path.
export const ROAD_HOLES = new Set(['gap', 'pothole', 'manhole', 'trench']);
export const VEHICLES = new Set(['bus', 'falcon', 'taxi', 'vehicle']);
export const HAZARDS = new Set(Object.keys(SHAPES).filter(kind =>
 !['ramp', 'roof', 'newspapers'].includes(kind)));
export const SOLID_HAZARDS = new Set([...HAZARDS].filter(kind => !ROAD_HOLES.has(kind)));
export const BREAKABLE = new Set([...SOLID_HAZARDS].filter(kind => !VEHICLES.has(kind)));
export const PAPER_STORM_INTERVAL = .85;

export function clearsAhead(power, object, x, paperPulse = false) {
 const length = object.length || SHAPES[object.kind]?.length || .7;
 if (object.z + length < -.42 || object.z >= 15) return false;
 if (power === 'afuera') return HAZARDS.has(object.kind) && Math.abs(object.lane - x) < .48;
 if (power === 'speech') return SOLID_HAZARDS.has(object.kind) && Math.abs(object.lane - x) < .48;
 return power === 'presspanic' && paperPulse && SOLID_HAZARDS.has(object.kind);
}
