// Bird visual — rendered at a fixed x position, animated y
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BIRD_W, BIRD_H, BIRD_X } from '../constants/gameConfig';
import { COLORS } from '../constants/theme';
import { Phase } from '../game/types';

interface Props {
  y: number;
  vy: number;     // velocity used to tilt the bird
  phase: Phase;
  dead?: boolean;
  invulnerable?: boolean;
}

const TRAIL_STEPS = 4;

export function BirdView({ y, vy, phase, dead = false, invulnerable = false }: Props) {
  const color = phase === 'blue' ? COLORS.phaseBlue : COLORS.phasePink;
  const glowColor = phase === 'blue' ? COLORS.phaseBlueGlow : COLORS.phasePinkGlow;

  // Tilt nose up when rising, down when falling
  const tilt = Math.max(-30, Math.min(35, vy * 0.032));

  // Pulsing glow ring
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (dead) return;
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [dead, phase, pulse]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Phase-colored trail dots */}
      {Array.from({ length: TRAIL_STEPS }, (_, i) => {
        const offset = (i + 1) * 9;
        const s = 1 - i * 0.2;
        const size = BIRD_W * s;
        return (
          <View
            key={i}
            style={[
              styles.trail,
              {
                left: BIRD_X - offset,
                top: y + BIRD_H / 2 - size / 2,
                width: size, height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: 0.14 - i * 0.03,
              },
            ]}
          />
        );
      })}

      {/* Outer glow pulse */}
      <Animated.View
        style={[
          styles.glow,
          {
            left: BIRD_X - 10,
            top: y - 10,
            width: BIRD_W + 20,
            height: BIRD_H + 20,
            borderRadius: (BIRD_W + 20) / 2,
            backgroundColor: glowColor,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* Bird body */}
      <View
        style={[
          styles.body,
          {
            left: BIRD_X, top: y,
            backgroundColor: color,
            borderColor: color,
            shadowColor: color,
            transform: [{ rotate: `${tilt}deg` }],
            opacity: dead ? 0.4 : invulnerable ? 0.72 : 1,
          },
        ]}
      >
        {/* Eye */}
        <View style={styles.eye} />
        {/* Beak */}
        <View style={[styles.beak, { borderLeftColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    width: BIRD_W, height: BIRD_H,
    borderRadius: BIRD_H / 2,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 10,
    elevation: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  eye: {
    position: 'absolute',
    right: 6, top: 5,
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  beak: {
    position: 'absolute',
    right: -5,
    width: 0, height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  glow: { position: 'absolute', opacity: 0.3 },
  trail: { position: 'absolute' },
});
