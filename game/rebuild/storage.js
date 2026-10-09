import {readSave as legacyRead,writeSave as legacyWrite} from '../storage.js';
export function readSave(storage){const saved=legacyRead(storage);return {...saved,version:3};}
export function writeSave(data,storage){return legacyWrite({...data,version:3},storage);}
