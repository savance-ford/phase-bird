// Small math utilities used by the game engine

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);
