// Shared game types

export type Phase = 'blue' | 'pink';

export type GameStatus = 'idle' | 'playing' | 'dead';

export interface Bird {
  y: number;       // top-edge y position
  vy: number;      // vertical velocity (positive = falling)
  phase: Phase;
}

export interface Obstacle {
  id: number;
  x: number;          // left-edge x
  gateTop: number;    // y of gate opening top
  gateBot: number;    // y of gate opening bottom
  phase: Phase;       // color the bird must match
  scored: boolean;    // already awarded a point
}

export interface GameState {
  status: GameStatus;
  score: number;
  bird: Bird;
  obstacles: Obstacle[];
  nextObstacleId: number;
  speed: number;       // current obstacle speed px/s
  spawnTimer: number;  // ms elapsed since last spawn
  invulnerableMs: number; // brief grace window after rewarded revive
}
