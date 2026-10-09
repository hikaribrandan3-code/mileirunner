import {readSave as legacyRead,writeSave as legacyWrite} from '../storage.js';
export function readSave(storage=globalThis.localStorage){const saved=legacyRead(storage);return {...saved,version:3};}
export function writeSave(data,storage=globalThis.localStorage){return legacyWrite({...data,version:3},storage);}
