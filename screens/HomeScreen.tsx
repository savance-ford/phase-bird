// Home screen — premium arcade landing page
import React, { useEffect, useRef } from 'react';
import {
  Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT } from '../constants/theme';
import { GlowButton } from '../components/GlowButton';
import { StarField } from '../components/StarField';

interface Props {
  best: number;
  onPlay: () => void;
  onHowToPlay: () => void;
}

export function HomeScreen({ best, onPlay, onHowToPlay }: Props) {
  // Subtle floating animation for the bird icon
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Continuous float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim, fadeAnim]);

  return (
    <View style={styles.root}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#050810', '#080d1c', '#050810']}
        style={StyleSheet.absoluteFill}
      />

      {/* Starfield */}
      <StarField />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Floating bird icon */}
          <Animated.View style={[styles.birdIconWrap, { transform: [{ translateY: floatAnim }] }]}>
            <View style={[styles.birdIcon, { backgroundColor: COLORS.phaseBlue, shadowColor: COLORS.phaseBlue }]}>
              {/* Eye */}
              <View style={styles.birdIconEye} />
              {/* Beak */}
              <View style={[styles.birdIconBeak, { borderLeftColor: COLORS.phaseBlue }]} />
            </View>
            {/* Glow halo */}
            <View style={[styles.birdHalo, { backgroundColor: COLORS.phaseBlueGlow }]} />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, FONT.title]}>PHASE{'\n'}BIRD</Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, FONT.subtitle]}>
            Tap to flap. Switch phase to survive.
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Best score badge */}
          {best > 0 && (
            <View style={styles.bestBadge}>
              <Text style={[styles.bestLabel, FONT.label]}>BEST</Text>
              <Text style={[styles.bestValue, FONT.titleSmall, { color: COLORS.phaseBlue }]}>{best}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <GlowButton
              label="Play"
              onPress={onPlay}
              color={COLORS.phaseBlue}
            />
            <View style={styles.buttonGap} />
            <GlowButton
              label="How to Play"
              onPress={onHowToPlay}
              color={COLORS.phasePink}
              small
              outline
            />
          </View>

          {/* Footer */}
          <Text style={[styles.footer, FONT.caption]}>Phase Bird v1.0</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  birdIconWrap: { marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
  birdIcon: {
    width: 56, height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 20,
    elevation: 12,
  },
  birdIconEye: {
    position: 'absolute', right: 11, top: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#fff',
  },
  birdIconBeak: {
    position: 'absolute', right: -7,
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8,
    borderStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
  },
  birdHalo: {
    position: 'absolute',
    width: 80, height: 66,
    borderRadius: 33,
    opacity: 0.35,
  },

  title: {
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 56,
    textShadowColor: COLORS.phaseBlue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  subtitle: {
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },

  divider: {
    width: 48, height: 2,
    backgroundColor: COLORS.whiteAlpha15,
    borderRadius: 1,
    marginVertical: 28,
  },

  bestBadge: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha15,
    backgroundColor: COLORS.whiteAlpha04,
  },
  bestLabel: { color: COLORS.whiteAlpha60, marginBottom: 2 },
  bestValue: {},

  buttons: { alignItems: 'center', gap: 14 },
  buttonGap: { height: 0 }, // gap handled by `gap` above

  footer: { position: 'absolute', bottom: 12, color: COLORS.whiteAlpha40 },
});
