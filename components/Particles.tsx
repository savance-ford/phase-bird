// Particle burst — used on phase switch and gate clear
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Props {
  x: number;
  y: number;
  color: string;
  count?: number;
  radius?: number;
  onDone?: () => void;
}

export function Particles({ x, y, color, count = 10, radius = 55, onDone }: Props) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      op: new Animated.Value(1),
      sc: new Animated.Value(1),
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6,
      speed: radius * (0.6 + Math.random() * 0.8),
    })),
  [count, radius]);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    Animated.parallel(
      particles.map(p =>
        Animated.parallel([
          Animated.timing(p.tx, { toValue: Math.cos(p.angle) * p.speed, duration: 480, useNativeDriver: true }),
          Animated.timing(p.ty, { toValue: Math.sin(p.angle) * p.speed + 20, duration: 480, useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 480, useNativeDriver: true }),
          Animated.timing(p.sc, { toValue: 0.2, duration: 480, useNativeDriver: true }),
        ])
      )
    ).start(() => onDone?.());
  }, [particles, onDone]);

  return (
    <View style={[styles.root, { left: x - 5, top: y - 5 }]} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              shadowColor: color,
              opacity: p.op,
              transform: [{ translateX: p.tx }, { translateY: p.ty }, { scale: p.sc }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute' },
  dot: {
    position: 'absolute',
    width: 9, height: 9,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 5,
  },
});
