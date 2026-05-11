// Visual theme constants for Phase Bird
// Dark neon arcade aesthetic

export const COLORS = {
  // Backgrounds
  background: '#050810',
  backgroundAlt: '#080d1c',

  // Blue (cyan) phase
  phaseBlue: '#00e5ff',
  phaseBlueGlow: 'rgba(0,229,255,0.35)',
  phaseBlueDim: 'rgba(0,229,255,0.12)',
  phaseBlueDark: 'rgba(0,60,80,0.9)',

  // Pink (magenta) phase
  phasePink: '#ff1a8c',
  phasePinkGlow: 'rgba(255,26,140,0.35)',
  phasePinkDim: 'rgba(255,26,140,0.12)',
  phasePinkDark: 'rgba(80,0,40,0.9)',

  // UI neutrals
  white: '#ffffff',
  whiteAlpha80: 'rgba(255,255,255,0.8)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha40: 'rgba(255,255,255,0.4)',
  whiteAlpha15: 'rgba(255,255,255,0.15)',
  whiteAlpha08: 'rgba(255,255,255,0.08)',
  whiteAlpha04: 'rgba(255,255,255,0.04)',

  // Feedback
  success: '#aaff00',
  danger: '#ff4444',

  // Overlay
  overlayDark: 'rgba(5,8,16,0.93)',
};

// Font sizes / weights used across the app
export const FONT = {
  title: { fontSize: 52, fontWeight: '900' as const, letterSpacing: 3 },
  titleSmall: { fontSize: 32, fontWeight: '800' as const, letterSpacing: 2 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0.8 },
  score: { fontSize: 40, fontWeight: '700' as const },
  scoreSub: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 2 },
  buttonSmall: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 1.5 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
};
