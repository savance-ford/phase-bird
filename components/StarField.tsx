// Subtle animated star-field background — twinkling dots
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SCREEN_W, SCREEN_H } from '../constants/gameConfig';

const COUNT = 55;

interface Star {
  x: number; y: number; r: number;
  anim: Animated.Value;
  duration: number;
}

export function StarField() {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: COUNT }, () => ({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      r: Math.random() * 1.8 + 0.4,
      anim: new Animated.Value(Math.random() * 0.5 + 0.1),
      duration: 1600 + Math.random() * 2800,
    })),
  []);

  const animsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    animsRef.current = stars.map(s =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(s.anim, { toValue: Math.random() * 0.15 + 0.03, duration: s.duration, useNativeDriver: true }),
          Animated.timing(s.anim, { toValue: Math.random() * 0.55 + 0.15, duration: s.duration, useNativeDriver: true }),
        ]),
      )
    );
    animsRef.current.forEach(a => a.start());
    return () => animsRef.current.forEach(a => a.stop());
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: s.x, top: s.y,
            width: s.r * 2, height: s.r * 2,
            borderRadius: s.r,
            backgroundColor: '#fff',
            opacity: s.anim,
          }}
        />
      ))}
    </View>
  );
}
