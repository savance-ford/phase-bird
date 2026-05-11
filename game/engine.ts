/**
 * Phase Bird — pure game engine
 *
 * All state transitions live here as plain functions.
 * No React, no side effects. Easy to test and extend.
 *
 * Call `tick(state, deltaMs)` once per animation frame.
 */

import {
  GRAVITY, FLAP_VELOCITY, MAX_FALL_SPEED, MAX_RISE_SPEED,
  CEILING, FLOOR,
  BIRD_X, BIRD_W, BIRD_H, BIRD_START_Y,
  OBS_W, OBS_SPAWN_X, OBS_DESPAWN_X,
  GATE_CENTRE_MIN, GATE_CENTRE_MAX,
  GATE_H_MIN, GATE_H_MAX,
  SPEED_INIT, SPEED_MAX, SPEED_PER_POINT,
  SPAWN_INTERVAL_INIT, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_EASE,
  COLLISION_SHRINK,
} from '../constants/gameConfig';
import { clamp, randomBetween } from '../utils/math';
import { Bird, GameState, Obstacle, Phase } from './types';

// Auto-incrementing id for obstacles
let _nextId = 1;

// ─── Factory ──────────────────────────────────────────────────────────────────

/** Fresh game state — call this when starting a new run */
export function createInitialState(): GameState {
  _nextId = 1;
  return {
    status: 'idle',
    score: 0,
    bird: { y: BIRD_START_Y, vy: 0, phase: 'blue' },
    obstacles: [],
    speed: SPEED_INIT,
    // Give the player a moment before the first obstacle appears
    spawnTimer: SPAWN_INTERVAL_INIT * 0.55,
    invulnerableMs: 0,
  };
}

// ─── Input handlers ───────────────────────────────────────────────────────────

/** Apply upward flap impulse to the bird */
export function flap(bird: Bird): Bird {
  return { ...bird, vy: clamp(FLAP_VELOCITY, MAX_RISE_SPEED, 0) };
}

/** Toggle the bird's phase (blue ↔ pink) */
export function switchPhase(bird: Bird): Bird {
  return { ...bird, phase: bird.phase === 'blue' ? 'pink' : 'blue' };
}

// ─── Obstacle generation ──────────────────────────────────────────────────────

/**
 * Spawn a new obstacle at the right edge of the screen.
 * Gate height shrinks slightly as score increases for a gradual difficulty ramp.
 */
function spawnObstacle(score: number): Obstacle {
  // Make gates a bit narrower as the game progresses
  const gateH = randomBetween(
    GATE_H_MIN,
    Math.max(GATE_H_MIN + 10, GATE_H_MAX - score * 1.8),
  );
  const centre = randomBetween(GATE_CENTRE_MIN, GATE_CENTRE_MAX);
  // Alternate phases with a mild random bias so the player can't predict perfectly
  const phase: Phase = Math.random() < 0.5 ? 'blue' : 'pink';

  return {
    id: _nextId++,
    x: OBS_SPAWN_X,
    gateTop: centre - gateH / 2,
    gateBot: centre + gateH / 2,
    phase,
    scored: false,
  };
}

// ─── Collision detection ──────────────────────────────────────────────────────

/**
 * Returns true if the bird is killed by this obstacle.
 *
 * Phasing rules:
 *  - Same phase as obstacle → bird phases through the entire column, no collision.
 *  - Different phase → must fly through the gate gap; hitting the solid walls kills the bird.
 */
function collidesWithObstacle(bird: Bird, obs: Obstacle): boolean {
  // Shrink hitbox for a forgiving feel
  const bL = BIRD_X + COLLISION_SHRINK;
  const bR = BIRD_X + BIRD_W - COLLISION_SHRINK;
  const bT = bird.y + COLLISION_SHRINK;
  const bB = bird.y + BIRD_H - COLLISION_SHRINK;

  const oL = obs.x;
  const oR = obs.x + OBS_W;

  // No horizontal overlap → safe
  if (bR <= oL || bL >= oR) return false;

  // Matching phase → fully phase through, no collision at all
  if (bird.phase === obs.phase) return false;

  // Wrong phase → must pass through the gap; solid walls are lethal
  const inGap = bT >= obs.gateTop && bB <= obs.gateBot;
  return !inGap;
}

// ─── Game events (returned per tick) ─────────────────────────────────────────

export type GameEvent = 'scored' | 'phaseSwitched' | 'died';

/**
 * Rewarded continue revive.
 *
 * We keep the current score and run, but move the bird back to a safe position,
 * clear out any obstacle that would instantly collide, and give a brief grace
 * window so the continue feels fair.
 */
export function reviveAfterReward(state: GameState): GameState {
  const safeY = clamp(BIRD_START_Y, CEILING + 20, FLOOR - BIRD_H - 20);
  const safeZoneRight = BIRD_X + BIRD_W + 120;
  const safeZoneLeft = BIRD_X - 32;

  return {
    ...state,
    status: 'playing',
    bird: {
      ...state.bird,
      y: safeY,
      vy: 0,
    },
    obstacles: state.obstacles.filter(o => o.x + OBS_W < safeZoneLeft || o.x > safeZoneRight),
    invulnerableMs: 1200,
  };
}

// ─── Main tick ────────────────────────────────────────────────────────────────

/**
 * Advance the game simulation by `deltaMs` milliseconds.
 *
 * Returns the updated state and an array of events that happened this frame
 * (used by the screen to trigger sounds / particles / haptics).
 */
export function tick(
  state: GameState,
  deltaMs: number,
): { state: GameState; events: GameEvent[] } {
  if (state.status !== 'playing') return { state, events: [] };

  const events: GameEvent[] = [];
  const dt = Math.min(deltaMs, 100) / 1000; // cap to prevent spiral-of-death

  // ── Move bird ──────────────────────────────────────────────────────────────
  const newVy = clamp(state.bird.vy + GRAVITY * dt, MAX_RISE_SPEED, MAX_FALL_SPEED);
  const newY = state.bird.y + newVy * dt;
  const movedBird: Bird = { ...state.bird, vy: newVy, y: newY };
  const nextInvulnerableMs = Math.max(0, state.invulnerableMs - deltaMs);

  // ── Ceiling / floor check ─────────────────────────────────────────────────
  if (newY <= CEILING || newY + BIRD_H >= FLOOR) {
    return {
      state: { ...state, bird: movedBird, status: 'dead', invulnerableMs: 0 },
      events: ['died'],
    };
  }

  // ── Spawn timer + new obstacles ───────────────────────────────────────────
  const spawnInterval = Math.max(
    SPAWN_INTERVAL_MIN,
    SPAWN_INTERVAL_INIT - state.score * SPAWN_INTERVAL_EASE,
  );
  let spawnTimer = state.spawnTimer + deltaMs;
  let obstacles = [...state.obstacles];

  if (spawnTimer >= spawnInterval) {
    obstacles.push(spawnObstacle(state.score));
    spawnTimer = 0;
  }

  // ── Move obstacles left ───────────────────────────────────────────────────
  obstacles = obstacles.map(o => ({ ...o, x: o.x - state.speed * dt }));

  // ── Scoring: bird mid-x passed the right edge of an obstacle ─────────────
  let score = state.score;
  const birdMid = BIRD_X + BIRD_W / 2;
  obstacles = obstacles.map(o => {
    if (!o.scored && birdMid > o.x + OBS_W) {
      score++;
      events.push('scored');
      return { ...o, scored: true };
    }
    return o;
  });

  // ── Collision check (after scoring so you're not robbed of a point) ───────
  for (const o of obstacles) {
    if (nextInvulnerableMs <= 0 && collidesWithObstacle(movedBird, o)) {
      return {
        state: { ...state, bird: movedBird, obstacles, score, status: 'dead', invulnerableMs: 0 },
        events: [...events, 'died'],
      };
    }
  }

  // ── Remove off-screen obstacles ───────────────────────────────────────────
  obstacles = obstacles.filter(o => o.x > OBS_DESPAWN_X);

  // ── Speed ramp ────────────────────────────────────────────────────────────
  const newSpeed = Math.min(SPEED_MAX, SPEED_INIT + score * SPEED_PER_POINT);

  return {
    state: {
      ...state,
      bird: movedBird,
      obstacles,
      score,
      spawnTimer,
      speed: newSpeed,
      invulnerableMs: nextInvulnerableMs,
    },
    events,
  };
}
