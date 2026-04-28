/**
 * krystal-core — Public API
 * Re-exports all engine modules for use in Crystal Studio and future SDKs.
 */

export { KrystalDecoder, parseLightTrack, ANCHOR_KEYWORDS } from './KrystalDecoder';
export { KrystalEncoder } from './KrystalEncoder';
export { XtalValidator } from './XtalValidator';
export { SigilForge, CANVAS_SIZE, CORE_SIZE, CORE_OFFSET } from './SigilForge';
export { crystalReducer, initialCrystalState } from './CrystalRuntime';
export type { CrystalAction } from './CrystalRuntime';
export * from './types'; // (note: interfaces/types in types.ts are automatically stripped by esbuild, but aliased types might need explicit export type)
