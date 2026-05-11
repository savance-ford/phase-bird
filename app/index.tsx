/**
 * App entry point — manages which screen is shown.
 *
 * Navigation is done manually (no react-navigation needed for a single-screen game):
 *   'home'        → HomeScreen
 *   'howtoplay'   → HowToPlayScreen
 *   'game'        → GameScreen
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { GameScreen } from '../screens/GameScreen';
import { useBestScore } from '../hooks/useBestScore';
import { COLORS } from '../constants/theme';

type Screen = 'home' | 'howtoplay' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { best } = useBestScore();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {screen === 'home' && (
        <HomeScreen
          best={best}
          onPlay={() => setScreen('game')}
          onHowToPlay={() => setScreen('howtoplay')}
        />
      )}

      {screen === 'howtoplay' && (
        <HowToPlayScreen onBack={() => setScreen('home')} />
      )}

      {screen === 'game' && (
        <GameScreen onMenu={() => setScreen('home')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
