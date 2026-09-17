/** Deterministic visual variation shared by server and browser renders. */
export function stableUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function stableSigned(seed: number, magnitude: number) {
  return (stableUnit(seed) * 2 - 1) * magnitude;
}
