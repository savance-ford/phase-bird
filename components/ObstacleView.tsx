// Single obstacle column — two blocks with a colored gate gap between them
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SCREEN_H, OBS_W } from '../constants/gameConfig';
import { COLORS } from '../constants/theme';
import { Obstacle } from '../game/types';

interface Props { obstacle: Obstacle }

export function ObstacleView({ obstacle }: Props) {
  const { x, gateTop, gateBot, phase } = obstacle;

  const color      = phase === 'blue' ? COLORS.phaseBlue     : COLORS.phasePink;
  const glowColor  = phase === 'blue' ? COLORS.phaseBlueGlow  : COLORS.phasePinkGlow;
  const darkBg     = phase === 'blue' ? COLORS.phaseBlueDark  : COLORS.phasePinkDark;

  const topH   = gateTop;
  const botH   = SCREEN_H - gateBot;
  const gateH  = gateBot - gateTop;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top block */}
      <View
        style={[
          styles.block,
          { left: x, top: 0, width: OBS_W, height: topH,
            backgroundColor: darkBg, borderColor: color, shadowColor: glowColor },
        ]}
      >
        {/* Bright bottom lip on top block */}
        <View style={[styles.lip, { bottom: 0, backgroundColor: color }]} />
      </View>

      {/* Bottom block */}
      <View
        style={[
          styles.block,
          { left: x, bottom: 0, width: OBS_W, height: botH,
            backgroundColor: darkBg, borderColor: color, shadowColor: glowColor },
        ]}
      >
        {/* Bright top lip on bottom block */}
        <View style={[styles.lip, { top: 0, backgroundColor: color }]} />
      </View>

      {/* Phase color stripe in the middle of the gap — subtle hint */}
      <View
        style={[
          styles.gateStripe,
          { left: x + OBS_W / 2 - 1, top: gateTop, height: gateH,
            backgroundColor: color, shadowColor: color },
        ]}
      />

      {/* Phase label badge — tiny colour dot inside the gap */}
      <View
        style={[
          styles.badge,
          { left: x + OBS_W / 2 - 8, top: gateTop + gateH / 2 - 8,
            backgroundColor: color, shadowColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  lip: {
    position: 'absolute',
    left: 0, right: 0,
    height: 3,
  },
  gateStripe: {
    position: 'absolute',
    width: 2,
    opacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  badge: {
    position: 'absolute',
    width: 16, height: 16,
    borderRadius: 8,
    opacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
});
