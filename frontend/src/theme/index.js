/**
 * Plata — Design System
 *
 * Paleta inspirada en un oasis: azules profundos, arena dorada, verde esmeralda.
 * Tipografía clara y espaciosa para máxima legibilidad.
 */

export const colors = {
  // Primarios
  primary: '#0D6B4F',       // Verde esmeralda — acciones principales
  primaryLight: '#E8F5F0',  // Fondo suave verde
  primaryDark: '#064D38',

  // Secundarios
  accent: '#D4A843',        // Dorado arena — acentos y highlights
  accentLight: '#FFF8E7',

  // Fondos
  background: '#F8F9FB',    // Gris casi blanco
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Texto
  textPrimary: '#0A1628',   // Azul muy oscuro
  textSecondary: '#5A6B82',
  textTertiary: '#8E9BB3',
  textInverse: '#FFFFFF',

  // Categorías (cada una con su color)
  categories: {
    Comida: '#E8593C',
    Transporte: '#3B8BD4',
    Salud: '#D4538B',
    Hogar: '#8B6FD4',
    Servicios: '#5A9E6F',
    Entretenimiento: '#E89B3C',
    Ropa: '#D45A8B',
    Educación: '#4B8BD4',
    Otros: '#8E9BB3',
  },

  // Semánticos
  success: '#0D6B4F',
  warning: '#D4A843',
  danger: '#D94444',
  info: '#3B8BD4',

  // Bordes
  border: '#E8ECF1',
  borderLight: '#F0F3F7',
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
  // Headings
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },

  // Body
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },

  // Labels
  label: { fontSize: 13, fontWeight: '500', lineHeight: 18, letterSpacing: 0.3 },
  labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.5 },

  // Numbers (para montos)
  amount: { fontSize: 32, fontWeight: '700', lineHeight: 38, letterSpacing: -1 },
  amountSmall: { fontSize: 20, fontWeight: '600', lineHeight: 26, letterSpacing: -0.5 },
};

export const shadows = {
  sm: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const darkColors = {
  primary: '#1D9E75',
  primaryLight: '#0D3D2E',
  primaryDark: '#15785A',
  accent: '#D4A843',
  accentLight: '#2D2010',
  background: '#0A1628',
  surface: '#111F35',
  surfaceElevated: '#1A2D45',
  textPrimary: '#F0F4F8',
  textSecondary: '#8E9BB3',
  textTertiary: '#5A6B82',
  textInverse: '#0A1628',
  categories: colors.categories,
  success: '#1D9E75',
  warning: '#D4A843',
  danger: '#E05555',
  info: '#4B9FE1',
  border: '#1E3050',
  borderLight: '#162540',
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
