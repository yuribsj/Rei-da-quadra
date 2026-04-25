export type ThemeColors = {
  bg:         string;
  bgDeep:     string;
  surface:    string;
  surface2:   string;
  border:     string;
  borderMid:  string;
  text:       string;
  textMuted:  string;
  textDim:    string;
  textFaint:  string;
  accent:     string;
  accentRgb:  string;
  error:      string;
  warning:    string;
  inputBg:    string;
  cardDoneBg: string;
  cardDoneBorder: string;
};

export const darkColors: ThemeColors = {
  bg:         '#09090E',
  bgDeep:     '#050509',
  surface:    '#141421',
  surface2:   '#1C1B2E',
  border:     'rgba(255,255,255,0.07)',
  borderMid:  'rgba(255,255,255,0.11)',
  text:       '#F0EFFF',
  textMuted:  '#6A6A8A',
  textDim:    '#4A4A6A',
  textFaint:  '#2E2E4A',
  accent:     '#D4A843',
  accentRgb:  '212,168,67',
  error:      '#FF6B6B',
  warning:    '#F5A623',
  inputBg:    'rgba(255,255,255,0.05)',
  cardDoneBg: '#050509',
  cardDoneBorder: 'rgba(255,255,255,0.12)',
};

export const lightColors: ThemeColors = {
  bg:         '#F2F2F7',
  bgDeep:     '#E8E8ED',
  surface:    '#FFFFFF',
  surface2:   '#F0F0F5',
  border:     'rgba(0,0,0,0.08)',
  borderMid:  'rgba(0,0,0,0.12)',
  text:       '#1A1A2E',
  textMuted:  '#6A6A8A',
  textDim:    '#8A8A9E',
  textFaint:  '#B0B0C0',
  accent:     '#C4952E',
  accentRgb:  '196,149,46',
  error:      '#E53935',
  warning:    '#E89B1C',
  inputBg:    'rgba(0,0,0,0.04)',
  cardDoneBg: '#E8E8ED',
  cardDoneBorder: 'rgba(0,0,0,0.10)',
};

// Default export for backward compat during migration
export const colors = darkColors;

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  22,
  full: 999,
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  14,
  lg:  20,
  xl:  28,
} as const;

export const font = {
  regular:     '400',
  medium:      '500',
  semibold:    '600',
  bold:        '700',
  extrabold:   '800',
  black:       '900',
} as const;
