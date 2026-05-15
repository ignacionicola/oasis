export const fonts = {
  // Display — Space Grotesk for hero numbers, titles
  display: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',
  // Body — Plus Jakarta Sans for UI
  sans: 'PlusJakartaSans_500Medium',
  sansRegular: 'PlusJakartaSans_400Regular',
  sansSemi: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtraBold: 'PlusJakartaSans_800ExtraBold',
  // Mono — JetBrains Mono for tabular amounts
  mono: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.sansSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, letterSpacing: 0.3 },
  labelSmall: { fontFamily: fonts.sansSemi, fontSize: 11, lineHeight: 14, letterSpacing: 0.5 },
  amount: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, letterSpacing: -1 },
  amountSmall: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.5 },
  mono: { fontFamily: fonts.mono, fontSize: 14 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Light theme
export const colors = {
  primary: '#6BAE12',
  primaryLight: 'rgba(107, 174, 18, 0.14)',
  primaryDark: '#4D8008',
  accent: '#6BAE12',
  accentLight: 'rgba(107, 174, 18, 0.1)',
  background: '#F7F9F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#0A1628',
  textSecondary: '#3D4E66',
  textTertiary: '#667894',
  textQuaternary: '#8899AA',
  textInverse: '#1A2E06',
  categories: {
    Comida: '#BF5A18',
    Transporte: '#2060B0',
    Salud: '#C03838',
    Hogar: '#1E7090',
    Servicios: '#1A9060',
    Entretenimiento: '#C08010',
    Ropa: '#C02860',
    Educación: '#5038A0',
    Otros: '#5038A0',
  },
  success: '#2A8848',
  warning: '#A87A08',
  danger: '#C03820',
  info: '#2060B0',
  border: '#DDE5EE',
  borderLight: '#EBF0F6',
};

// Dark theme  — matches the prototype's --ink / --lime / --t* variables
export const darkColors = {
  // electric lime accent (oklch 0.92 0.19 122)
  primary: '#BFEF35',
  primaryLight: 'rgba(191, 239, 53, 0.16)',
  primaryDark: '#9AC420',
  accent: '#BFEF35',
  accentLight: 'rgba(191, 239, 53, 0.1)',

  // surfaces  (oklch ink-0 → ink-3)
  background: '#0D1420',
  surface: '#111F35',
  surfaceElevated: '#162840',

  // text  (oklch t1 → t4)
  textPrimary: '#F4F7FA',
  textSecondary: '#B0BFCF',
  textTertiary: '#7888A0',
  textQuaternary: '#4A5870',
  textInverse: '#1A2E06',

  // category palette
  categories: {
    Comida: '#D48040',
    Transporte: '#4080D0',
    Salud: '#D06050',
    Hogar: '#4090B0',
    Servicios: '#45C880',
    Entretenimiento: '#D8B040',
    Ropa: '#D45080',
    Educación: '#7060D0',
    Otros: '#7060D0',
  },

  // semantic
  success: '#68C875',
  warning: '#E8C840',
  danger: '#E06240',
  info: '#4080D0',

  // borders  (oklch line / line-soft)
  border: '#233050',
  borderLight: 'rgba(74, 100, 140, 0.25)',
};

export const categoryIcons = {
  Comida: 'restaurant',
  Transporte: 'directions-car',
  Salud: 'favorite',
  Hogar: 'home',
  Servicios: 'receipt',
  Entretenimiento: 'movie',
  Ropa: 'checkroom',
  Educación: 'school',
  Otros: 'more-horiz',
};
