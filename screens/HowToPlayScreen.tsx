// How To Play screen — concise visual instructions
import React from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT } from '../constants/theme';
import { GlowButton } from '../components/GlowButton';
import { StarField } from '../components/StarField';

interface Step {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: '👆',
    title: 'Tap LEFT to Flap',
    desc: 'Tap the left half of the screen to make the bird flap upward. Hold nothing — every tap is one flap.',
    color: COLORS.phaseBlue,
  },
  {
    icon: '🔄',
    title: 'Tap RIGHT to Switch Phase',
    desc: 'Tap the right half to toggle between Cyan and Pink phase. The bird\'s color changes instantly.',
    color: COLORS.phasePink,
  },
  {
    icon: '👻',
    title: 'Phase Through Same Color',
    desc: 'When your phase matches a pillar\'s color, you phase straight through the entire column — walls and all.',
    color: COLORS.phaseBlue,
  },
  {
    icon: '🎯',
    title: 'Use the Gap for Wrong Color',
    desc: 'When your phase doesn\'t match, you must fly through the gate gap in the middle. Hitting the walls is instant death.',
    color: COLORS.phasePink,
  },
  {
    icon: '⚡',
    title: 'Score by Clearing Gates',
    desc: 'Each gate you pass through scores +1. The game gets faster the higher you score.',
    color: COLORS.phasePink,
  },
  {
    icon: '💀',
    title: 'Avoid Walls & Wrong Phase',
    desc: 'Don\'t hit the ceiling, floor, or solid parts of obstacles. Entering the wrong-color gate is instant death.',
    color: COLORS.danger,
  },
];

interface Props {
  onBack: () => void;
}

export function HowToPlayScreen({ onBack }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050810', '#080d1c', '#050810']}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, FONT.titleSmall]}>HOW TO PLAY</Text>
          <View style={styles.divider} />
        </View>

        {/* Steps */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.card, { borderColor: step.color + '44' }]}>
              <View style={[styles.iconBadge, { backgroundColor: step.color + '22', borderColor: step.color + '55' }]}>
                <Text style={styles.icon}>{step.icon}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, FONT.scoreSub, { color: step.color }]}>
                  {step.title}
                </Text>
                <Text style={[styles.cardDesc, FONT.caption, { color: COLORS.whiteAlpha60 }]}>
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}

          {/* Visual diagram hint */}
          <View style={styles.diagram}>
            <View style={styles.diagramHalf}>
              <View style={[styles.diagramBox, { borderColor: COLORS.phaseBlue + '88' }]}>
                <Text style={[styles.diagramLabel, { color: COLORS.phaseBlue }]}>FLAP</Text>
              </View>
            </View>
            <View style={styles.diagramDivider} />
            <View style={styles.diagramHalf}>
              <View style={[styles.diagramBox, { borderColor: COLORS.phasePink + '88' }]}>
                <Text style={[styles.diagramLabel, { color: COLORS.phasePink }]}>PHASE</Text>
              </View>
            </View>
          </View>

          <View style={styles.backWrap}>
            <GlowButton label="Got it!" onPress={onBack} color={COLORS.phaseBlue} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  heading: {
    color: COLORS.white,
    textShadowColor: COLORS.phaseBlue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  divider: { width: 40, height: 2, backgroundColor: COLORS.whiteAlpha15, borderRadius: 1, marginTop: 12 },

  scroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    backgroundColor: COLORS.whiteAlpha04,
    gap: 14,
  },
  iconBadge: {
    width: 44, height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 22 },
  cardText: { flex: 1 },
  cardTitle: { marginBottom: 4 },
  cardDesc: {},

  diagram: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha15,
    borderRadius: 14,
    overflow: 'hidden',
    height: 72,
    marginTop: 4,
    backgroundColor: COLORS.whiteAlpha04,
  },
  diagramHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  diagramDivider: { width: 1, backgroundColor: COLORS.whiteAlpha15 },
  diagramBox: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  diagramLabel: { fontWeight: '700', letterSpacing: 2, fontSize: 13 },

  backWrap: { alignItems: 'center', marginTop: 8 },
});
