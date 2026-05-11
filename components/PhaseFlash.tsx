// Full-screen flash overlay triggered on phase switch or death
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Props {
  color: string;
  trigger: number; // increment this value to fire the animation
  opacity?: number;
}

export function PhaseFlash({ color, trigger, opacity = 0.22 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    anim.setValue(opacity);
    Animated.timing(anim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [trigger, anim, opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: anim }]}
      pointerEvents="none"
    />
  );
}
