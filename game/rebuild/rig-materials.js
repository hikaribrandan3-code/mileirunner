// Blender appends .001/.002 when duplicating a material. Asset semantics must
// survive those exporter suffixes (cotton, rubber soles and rear head artwork).
export const materialName = material => (material?.name || '').replace(/\.\d+$/, '');
