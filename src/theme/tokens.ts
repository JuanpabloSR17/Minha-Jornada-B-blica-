export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceRaised: string;
  stage: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  accent: string;
  danger: string;
  dangerSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  infoSurface: string;
  focus: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: '#F3E8D2',
  backgroundAlt: '#EADBBE',
  surface: '#FBF5E8',
  surfaceRaised: '#FFFAF0',
  stage: '#E9D7B2',
  border: '#D9C49C',
  borderStrong: '#B48C55',
  text: '#2A1F16',
  textMuted: '#6B5A47',
  primary: '#8C4A2F',
  primaryPressed: '#733B24',
  onPrimary: '#FFF8EC',
  accent: '#B8862B',
  danger: '#A12E2E',
  dangerSurface: '#F6DCD4',
  success: '#3F6B3A',
  successSurface: '#DCE8D2',
  warning: '#8A5A12',
  warningSurface: '#F5E3BC',
  infoSurface: '#E5DCC8',
  focus: '#2F5D8A',
  overlay: 'rgba(30, 20, 10, 0.55)',
};

export const darkColors: ThemeColors = {
  background: '#17130F',
  backgroundAlt: '#1F1A14',
  surface: '#241E17',
  surfaceRaised: '#2C251C',
  stage: '#30281E',
  border: '#433829',
  borderStrong: '#8C6E3E',
  text: '#F2E8D5',
  textMuted: '#BCAA90',
  primary: '#E0B252',
  primaryPressed: '#C99A3E',
  onPrimary: '#1E160C',
  accent: '#E0B252',
  danger: '#F08A7A',
  dangerSurface: '#3D211C',
  success: '#9CCB8E',
  successSurface: '#1F2E1C',
  warning: '#E8C06A',
  warningSurface: '#3A2E17',
  infoSurface: '#2A241C',
  focus: '#8DB8E8',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const;

export const fonts = {
  display: 'Cinzel_700Bold',
  displayRegular: 'Cinzel_600SemiBold',
} as const;
