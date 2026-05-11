// In-game score display at the top of the screen
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../constants/theme';

interface Props {
  score: number;
  best: number;
}

export function ScoreHUD({ score, best }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.score, FONT.score]}>{score}</Text>
      <Text style={[styles.best, FONT.scoreSub]}>BEST  {best}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    color: COLORS.white,
    textShadowColor: 'rgba(0,229,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  best: {
    color: COLORS.whiteAlpha60,
    marginTop: 2,
    letterSpacing: 1,
  },
});
