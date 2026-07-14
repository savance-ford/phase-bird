/**
 * GameScreen — the main gameplay view.
 *
 * Architecture:
 *  - Game state lives in a React ref (not useState) so we never re-render on
 *    every frame. Only the display values (score, bird position, obstacles) are
 *    synced into React state at frame rate.
 *  - The game loop runs via useGameLoop → requestAnimationFrame.
 *  - Touch zones split the screen in half: left = flap, right = switch phase.
 *  - Visual feedback (particles, flashes, screen-shake) is pure React Animated.
 *  - Rewarded continue is mocked for now so real AdMob can drop in later.
 *  - See `ads/AD_MOB_SETUP.md` before replacing the mock adapter.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  createInitialState,
  flap,
  reviveAfterReward,
  switchPhase,
  tick,
  GameEvent,
} from '../game/engine';
import { GameState, Obstacle, Phase } from '../game/types';

import { BIRD_X, BIRD_W, BIRD_H, SCREEN_W, SCREEN_H } from '../constants/gameConfig';
import { COLORS, FONT } from '../constants/theme';

import { useGameLoop } from '../hooks/useGameLoop';
import { useBestScore } from '../hooks/useBestScore';
import { useHaptics } from '../hooks/useHaptics';
import { useMockRewardedContinueAd } from '../ads/useMockRewardedContinueAd';

import { BirdView } from '../components/BirdView';
import { ObstacleView } from '../components/ObstacleView';
import { ScoreHUD } from '../components/ScoreHUD';
import { StarField } from '../components/StarField';
import { Particles } from '../components/Particles';
import { PhaseFlash } from '../components/PhaseFlash';
import { GlowButton } from '../components/GlowButton';

interface Props {
  onMenu: () => void;
}

function useLazyRef<T>(createValue: () => T): React.RefObject<T> {
  const ref = useRef<T | null>(null);
  if (ref.current === null) {
    ref.current = createValue();
  }
  return ref as React.RefObject<T>;
}

// ─── Display state (synced into React state each frame) ───────────────────────
interface DisplayState {
  birdY: number;
  birdVy: number;
  birdPhase: Phase;
  obstacles: Obstacle[];
  score: number;
  gameStatus: GameState['status'];
  invulnerableMs: number;
}

// ─── Particle burst record ────────────────────────────────────────────────────
interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
}

let burstId = 0;

export function GameScreen({ onMenu }: Props) {
  const haptics = useHaptics();
  const { best, update: updateBest } = useBestScore();
  const rewardedContinueAd = useMockRewardedContinueAd();

  // ── Mutable game state in a ref — never triggers re-renders ───────────────
  const stateRef = useLazyRef(createInitialState);

  // ── Display state — synced from stateRef each frame ───────────────────────
  const [display, setDisplay] = useState<DisplayState>({
    birdY: stateRef.current.bird.y,
    birdVy: 0,
    birdPhase: 'blue',
    obstacles: [],
    score: 0,
    gameStatus: 'idle',
    invulnerableMs: 0,
  });

  // ── Game-over result ───────────────────────────────────────────────────────
  const [finalScore, setFinalScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [continueUsedThisRun, setContinueUsedThisRun] = useState(false);
  const [continueMessage, setContinueMessage] = useState<string | null>(null);

  // ── Visual effects ─────────────────────────────────────────────────────────
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [phaseFlashTrigger, setPhaseFlashTrigger] = useState(0);
  const [phaseFlashColor, setPhaseFlashColor] = useState(COLORS.phaseBlue);
  const [deathFlashTrigger, setDeathFlashTrigger] = useState(0);

  // Screen shake on death
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // Game-over overlay fade
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ── Game loop ──────────────────────────────────────────────────────────────
  const [loopRunning, setLoopRunning] = useState(false);

  // Warm a test ad as soon as the screen mounts so the first death has a chance
  // to show a ready rewarded ad. When you swap to real AdMob, keep this preload
  // behavior if possible so the rewarded continue is often ready at Game Over.
  // See ads/AD_MOB_SETUP.md for the rebuild/config requirements.
  useEffect(() => {
    rewardedContinueAd.loadAd().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncDisplayFromState = useCallback((state: GameState) => {
    setDisplay({
      birdY: state.bird.y,
      birdVy: state.bird.vy,
      birdPhase: state.bird.phase,
      obstacles: state.obstacles,
      score: state.score,
      gameStatus: state.status,
      invulnerableMs: state.invulnerableMs,
    });
  }, []);

  const gameTick = useCallback((deltaMs: number) => {
    const { state: next, events } = tick(stateRef.current, deltaMs);
    stateRef.current = next;

    // Sync display
    syncDisplayFromState(next);

    if (events.length === 0) return;

    // ── Handle events ────────────────────────────────────────────────────────
    for (const ev of events) {
      handleEvent(ev, next);
    }
  }, [syncDisplayFromState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEvent = useCallback(
    (ev: GameEvent, state: GameState) => {
      if (ev === 'scored') {
        haptics.light();
        // Particle burst at bird position
        setBursts(prev => [
          ...prev,
          {
            id: burstId++,
            x: BIRD_X + BIRD_W / 2,
            y: state.bird.y + BIRD_H / 2,
            color: state.bird.phase === 'blue' ? COLORS.phaseBlue : COLORS.phasePink,
          },
        ]);
      } else if (ev === 'died') {
        haptics.error();
        setLoopRunning(false);
        setContinueMessage(null);

        // If we have not spent the continue yet, start loading a mock ad now.
        if (!continueUsedThisRun && !rewardedContinueAd.isLoaded && !rewardedContinueAd.isLoading) {
          rewardedContinueAd.loadAd().catch(() => {});
        }

        // Screen shake
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 6, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -6, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.timing(shakeY, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();

        // Death flash
        setDeathFlashTrigger(t => t + 1);

        // Show game over overlay
        setFinalScore(state.score);
        updateBest(state.score).then(isNew => {
          setIsNewBest(isNew);
          overlayAnim.setValue(0);
          Animated.timing(overlayAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
        });
      }
    },
    [
      continueUsedThisRun,
      haptics,
      overlayAnim,
      rewardedContinueAd,
      shakeX,
      shakeY,
      updateBest,
    ],
  );

  useGameLoop(gameTick, loopRunning);

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const handleLeftTap = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'dead') return;

    // First tap starts the game
    if (s.status === 'idle') {
      stateRef.current = { ...s, status: 'playing' };
      syncDisplayFromState(stateRef.current);
      setLoopRunning(true);
    }

    stateRef.current = { ...stateRef.current, bird: flap(stateRef.current.bird) };
  }, [stateRef, syncDisplayFromState]);

  const handleRightTap = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing') return;

    const newBird = switchPhase(s.bird);
    stateRef.current = { ...s, bird: newBird };

    haptics.medium();

    const color = newBird.phase === 'blue' ? COLORS.phaseBlue : COLORS.phasePink;
    setPhaseFlashColor(color);
    setPhaseFlashTrigger(t => t + 1);

    // Particle burst at bird position
    setBursts(prev => [
      ...prev,
      {
        id: burstId++,
        x: BIRD_X + BIRD_W / 2,
        y: s.bird.y + BIRD_H / 2,
        color,
      },
    ]);
  }, [haptics, stateRef]);

  const handleRewardedContinue = useCallback(async () => {
    if (continueUsedThisRun || rewardedContinueAd.isShowing) return;

    setContinueMessage(null);

    // Graceful failure path: if no ad is loaded yet, try loading one and stay
    // on the game-over screen if that load misses. Keep this behavior when you
    // replace the mock with the real AdMob rewarded implementation.
    if (!rewardedContinueAd.isLoaded) {
      const loaded = await rewardedContinueAd.loadAd();
      if (!loaded) {
        setContinueMessage('Test ad unavailable right now. Try again in a moment.');
        return;
      }
    }

    const result = await rewardedContinueAd.showAd();
    if (result !== 'reward-earned') {
      setContinueMessage('The rewarded continue did not complete.');
      return;
    }

    haptics.success();
    setContinueUsedThisRun(true);
    setContinueMessage('Reward earned. Continuing run...');

    const revived = reviveAfterReward(stateRef.current);
    stateRef.current = revived;
    overlayAnim.setValue(0);
    setPhaseFlashColor(COLORS.success);
    setPhaseFlashTrigger(t => t + 1);
    setBursts(prev => [
      ...prev,
      {
        id: burstId++,
        x: BIRD_X + BIRD_W / 2,
        y: revived.bird.y + BIRD_H / 2,
        color: COLORS.success,
      },
    ]);
    syncDisplayFromState(revived);
    setLoopRunning(true);
  }, [continueUsedThisRun, haptics, overlayAnim, rewardedContinueAd, stateRef, syncDisplayFromState]);

  // ── Restart / menu ─────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    overlayAnim.setValue(0);
    setBursts([]);
    setContinueUsedThisRun(false);
    setContinueMessage(null);
    rewardedContinueAd.resetForNextRun();

    stateRef.current = createInitialState();
    stateRef.current = { ...stateRef.current, status: 'playing' };
    syncDisplayFromState(stateRef.current);
    setLoopRunning(true);

    rewardedContinueAd.loadAd().catch(() => {});
  }, [overlayAnim, rewardedContinueAd, stateRef, syncDisplayFromState]);

  const handleMenu = useCallback(() => {
    setLoopRunning(false);
    overlayAnim.setValue(0);
    setContinueUsedThisRun(false);
    setContinueMessage(null);
    rewardedContinueAd.resetForNextRun();
    onMenu();
  }, [onMenu, overlayAnim, rewardedContinueAd]);

  // ── Remove burst from list once animation completes ────────────────────────
  const removeBurst = useCallback((id: number) => {
    setBursts(prev => prev.filter(b => b.id !== id));
  }, []);

  const isDead = display.gameStatus === 'dead';
  const isIdle = display.gameStatus === 'idle';
  const canOfferContinue = isDead && !continueUsedThisRun;

  const continueButtonLabel = rewardedContinueAd.isShowing
    ? 'Showing Test Ad...'
    : rewardedContinueAd.isLoading
      ? 'Loading Ad...'
      : rewardedContinueAd.isLoaded
        ? 'Continue This Run?'
        : rewardedContinueAd.lastError
          ? 'Retry Loading Ad'
          : 'Loading Ad...';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050810', '#080d1c', '#050810']}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      {/* ── Shake wrapper ──────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shakeX }, { translateY: shakeY }] },
        ]}
      >
        {/* ── Obstacles ────────────────────────────────────────────────────── */}
        {display.obstacles.map(obs => (
          <ObstacleView key={obs.id} obstacle={obs} />
        ))}

        {/* ── Bird ─────────────────────────────────────────────────────────── */}
        <BirdView
          y={display.birdY}
          vy={display.birdVy}
          phase={display.birdPhase}
          dead={isDead}
          invulnerable={display.invulnerableMs > 0}
        />
      </Animated.View>

      {/* ── Touch zones ──────────────────────────────────────────────────────
           These sit on top of the game world but below the HUD overlays.
           They intercept all taps, so we must ensure UI buttons are rendered
           ABOVE these and handle their own press events.                      */}
      {!isDead && (
        <>
          {/* Left half — flap */}
          <TouchableWithoutFeedback onPress={handleLeftTap}>
            <View style={styles.touchLeft} />
          </TouchableWithoutFeedback>

          {/* Right half — switch phase */}
          <TouchableWithoutFeedback onPress={handleRightTap}>
            <View style={styles.touchRight} />
          </TouchableWithoutFeedback>
        </>
      )}

      {/* ── Phase flash overlay ──────────────────────────────────────────────── */}
      <PhaseFlash color={phaseFlashColor} trigger={phaseFlashTrigger} opacity={0.18} />

      {/* ── Death flash ──────────────────────────────────────────────────────── */}
      <PhaseFlash color={COLORS.danger} trigger={deathFlashTrigger} opacity={0.3} />

      {/* ── Particle bursts ──────────────────────────────────────────────────── */}
      {bursts.map(b => (
        <Particles
          key={b.id}
          x={b.x} y={b.y}
          color={b.color}
          count={8}
          radius={48}
          onDone={() => removeBurst(b.id)}
        />
      ))}

      {/* ── Score HUD ────────────────────────────────────────────────────────── */}
      <ScoreHUD score={display.score} best={best} />

      {/* ── Idle hint ────────────────────────────────────────────────────────── */}
      {isIdle && (
        <View style={styles.idleHint} pointerEvents="none">
          <Text style={[styles.idleText, FONT.subtitle]}>Tap LEFT to start flapping</Text>
          <View style={styles.idleRow}>
            <View style={[styles.idleZone, { borderColor: COLORS.phaseBlue + '66' }]}>
              <Text style={[styles.idleZoneLabel, { color: COLORS.phaseBlue }]}>FLAP</Text>
            </View>
            <View style={[styles.idgeZoneDivider]} />
            <View style={[styles.idleZone, { borderColor: COLORS.phasePink + '66' }]}>
              <Text style={[styles.idleZoneLabel, { color: COLORS.phasePink }]}>PHASE</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Mock rewarded overlay ───────────────────────────────────────────── */}
      {rewardedContinueAd.isShowing && (
        <View style={styles.mockAdBackdrop} pointerEvents="none">
          <View style={styles.mockAdCard}>
            <ActivityIndicator color={COLORS.phaseBlue} />
            <Text style={[styles.mockAdTitle, FONT.titleSmall]}>TEST REWARDED AD</Text>
            <Text style={[styles.mockAdBody, FONT.body]}>
              Mock ad playing now. Replace this hook with real AdMob rewarded code later.
            </Text>
          </View>
        </View>
      )}

      {/* ── Game Over overlay ────────────────────────────────────────────────── */}
      {isDead && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}> 
          <SafeAreaView style={styles.overlaySafe}>
            <View style={styles.overlayCard}>
              {isNewBest && (
                <View style={styles.newBestBadge}>
                  <Text style={[styles.newBestText, FONT.label, { color: COLORS.success }]}>
                    NEW BEST!
                  </Text>
                </View>
              )}

              <Text style={[styles.gameOverTitle, FONT.titleSmall]}>GAME OVER</Text>

              {/* Final score */}
              <View style={styles.scoreBlock}>
                <Text style={[styles.scoreLabel, FONT.label]}>SCORE</Text>
                <Text style={[styles.scoreValue, FONT.score, { color: COLORS.phaseBlue }]}>
                  {finalScore}
                </Text>
              </View>

              <View style={styles.scoreDivider} />

              {/* Best score */}
              <View style={styles.scoreBlock}>
                <Text style={[styles.scoreLabel, FONT.label]}>BEST</Text>
                <Text style={[styles.scoreValue, FONT.scoreSub, { color: COLORS.whiteAlpha60 }]}>
                  {best}
                </Text>
              </View>

              {canOfferContinue && (
                <View style={styles.continueBlock}>
                  <GlowButton
                    label={continueButtonLabel}
                    onPress={handleRewardedContinue}
                    color={COLORS.success}
                    disabled={rewardedContinueAd.isLoading || rewardedContinueAd.isShowing}
                  />
                  <Text style={[styles.continueCaption, FONT.caption]}>
                    {continueMessage
                      ?? rewardedContinueAd.lastError
                      ?? 'Mock rewarded ad: one revive allowed per run.'}
                  </Text>
                </View>
              )}

              {!canOfferContinue && continueUsedThisRun && (
                <Text style={[styles.continueCaption, FONT.caption]}>
                  Rewarded continue already used this run.
                </Text>
              )}

              {/* Buttons */}
              <View style={styles.overlayButtons}>
                <GlowButton
                  label="Play Again"
                  onPress={handleRestart}
                  color={COLORS.phaseBlue}
                />
                <View style={{ height: 14 }} />
                <GlowButton
                  label="Main Menu"
                  onPress={handleMenu}
                  color={COLORS.phasePink}
                  small
                  outline
                />
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Touch zones — invisible full-height strips
  touchLeft: {
    position: 'absolute', left: 0, top: 0,
    width: SCREEN_W / 2, height: SCREEN_H,
  },
  touchRight: {
    position: 'absolute', right: 0, top: 0,
    width: SCREEN_W / 2, height: SCREEN_H,
  },

  // Idle hint
  idleHint: {
    position: 'absolute',
    bottom: 120,
    left: 0, right: 0,
    alignItems: 'center',
  },
  idleText: { color: COLORS.whiteAlpha60, marginBottom: 16 },
  idleRow: { flexDirection: 'row', width: SCREEN_W * 0.7, height: 52 },
  idleZone: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.whiteAlpha04,
  },
  idgeZoneDivider: { width: 8 },
  idleZoneLabel: { fontWeight: '700', fontSize: 12, letterSpacing: 2 },

  // Game-over overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDark,
    zIndex: 100,
  },
  overlaySafe: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayCard: {
    width: SCREEN_W * 0.82,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha15,
    backgroundColor: COLORS.backgroundAlt,
    padding: 32,
    alignItems: 'center',
  },

  newBestBadge: {
    paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.success + '66',
    backgroundColor: COLORS.success + '15',
    marginBottom: 16,
  },
  newBestText: {},

  gameOverTitle: {
    color: COLORS.white,
    marginBottom: 28,
    textShadowColor: COLORS.danger,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  scoreBlock: { alignItems: 'center', paddingVertical: 6 },
  scoreLabel: { color: COLORS.whiteAlpha40, letterSpacing: 1.5 },
  scoreValue: {},
  scoreDivider: {
    width: 40, height: 1,
    backgroundColor: COLORS.whiteAlpha15,
    marginVertical: 12,
  },

  continueBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  continueCaption: {
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 240,
  },

  overlayButtons: { marginTop: 28, alignItems: 'center' },

  mockAdBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
    backgroundColor: 'rgba(5, 8, 16, 0.76)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAdCard: {
    width: SCREEN_W * 0.78,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.phaseBlue + '66',
    backgroundColor: COLORS.backgroundAlt,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: COLORS.phaseBlue,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  mockAdTitle: {
    color: COLORS.phaseBlue,
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  mockAdBody: {
    color: COLORS.whiteAlpha80,
    textAlign: 'center',
  },
});
