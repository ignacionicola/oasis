import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { View } from 'react-native';

const icons = {
  Comida: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v8a2 2 0 002 2v8M8 3v6M18 3v9a2 2 0 01-2 2v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  Transporte: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 16V8a2 2 0 012-2h10a2 2 0 012 2v8M5 16h14M5 16v2a1 1 0 001 1h1a1 1 0 001-1v-2M16 16v2a1 1 0 001 1h1a1 1 0 001-1v-2M5 11h14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="8" cy="13.5" r="0.7" fill={color} />
      <Circle cx="16" cy="13.5" r="0.7" fill={color} />
    </Svg>
  ),
  Salud: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s-7-4.5-7-10a4.5 4.5 0 017-3.7A4.5 4.5 0 0119 11c0 5.5-7 10-7 10z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  ),
  Hogar: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  ),
  Servicios: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  Entretenimiento: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  ),
  Ropa: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3a3 3 0 006 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 5l-9 6 3 3 3-2v9h6v-9l3 2 3-3-9-6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  ),
  Educación: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 7l10-5 10 5-10 5-10-5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M6 9.5V16l6 3 6-3V9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 7v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  Otros: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="1.6" fill={color} />
      <Circle cx="12" cy="12" r="1.6" fill={color} />
      <Circle cx="18" cy="12" r="1.6" fill={color} />
    </Svg>
  ),
};

export default function CategoryIcon({ category, color, size = 22, containerSize = 44, style }) {
  const IconComponent = icons[category] || icons.Otros;
  return (
    <View style={[{
      width: containerSize,
      height: containerSize,
      borderRadius: Math.round(containerSize * 0.32),
      backgroundColor: color + '20',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }, style]}>
      <IconComponent color={color} size={size} />
    </View>
  );
}
