// Reusable neon-glow button with press spring animation
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { COLORS, FONT } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  small?: boolean;
  outline?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export function GlowButton({
  label,
  onPress,
  color = COLORS.phaseBlue,
  small = false,
  outline = false,
  style,
  disabled = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 3 }).start();

  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 32, bounciness: 7 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[
          styles.btn,
          small ? styles.btnSmall : styles.btnLarge,
          outline
            ? { backgroundColor: 'transparent', borderColor: color }
            : { backgroundColor: color + '22', borderColor: color },
          disabled && { opacity: 0.4 },
          { shadowColor: color },
        ]}
      >
        <Text
          style={[
            small ? FONT.buttonSmall : FONT.button,
            { color, textTransform: 'uppercase' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  btnLarge: { paddingVertical: 16, paddingHorizontal: 52, minWidth: 220 },
  btnSmall: { paddingVertical: 11, paddingHorizontal: 32, minWidth: 140 },
});
