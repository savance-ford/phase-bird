// Game configuration — all tunable values in one place
// Tweak these to adjust game feel and difficulty

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
export const SCREEN_W = width;
export const SCREEN_H = height;

// ─── Bird ─────────────────────────────────────────────────────────────────────
export const BIRD_W = 32;
export const BIRD_H = 26;
// Horizontal position: 22% from left, stays fixed
export const BIRD_X = Math.round(SCREEN_W * 0.22);
export const BIRD_START_Y = Math.round(SCREEN_H * 0.44);

// ─── Physics ──────────────────────────────────────────────────────────────────
export const GRAVITY = 1700;        // px/s²  — downward acceleration
export const FLAP_VELOCITY = -530;  // px/s   — upward snap on tap
export const MAX_FALL_SPEED = 750;  // px/s   — terminal velocity
export const MAX_RISE_SPEED = -580; // px/s   — cap on flap burst

// ─── Bounds ───────────────────────────────────────────────────────────────────
export const CEILING = 56;               // y pixel — die above this
export const FLOOR = SCREEN_H - 70;      // y pixel — die below this (bird bottom)

// ─── Obstacles ────────────────────────────────────────────────────────────────
export const OBS_W = 52;                            // pipe column width
export const OBS_SPAWN_X = SCREEN_W + OBS_W + 20;  // off-screen right
export const OBS_DESPAWN_X = -(OBS_W + 20);        // off-screen left

// Gate (gap) size — min/max height of the opening
export const GATE_H_MIN = 148;
export const GATE_H_MAX = 200;
// Vertical range for gate centre
export const GATE_CENTRE_MIN = CEILING + 120;
export const GATE_CENTRE_MAX = FLOOR - 120;

// ─── Difficulty ───────────────────────────────────────────────────────────────
export const SPEED_INIT = 195;          // px/s   — starting obstacle speed
export const SPEED_MAX = 360;           // px/s   — top obstacle speed
export const SPEED_PER_POINT = 4.5;    // px/s increase per point scored

export const SPAWN_INTERVAL_INIT = 1900; // ms between spawns at start
export const SPAWN_INTERVAL_MIN = 980;   // minimum ms between spawns
export const SPAWN_INTERVAL_EASE = 20;  // ms reduced per point

// ─── Collision ────────────────────────────────────────────────────────────────
// Shrink hitbox slightly so near-misses feel fair
export const COLLISION_SHRINK = 5;
