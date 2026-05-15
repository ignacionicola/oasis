import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Defs, RadialGradient, LinearGradient, Stop, Rect,
} from 'react-native-svg';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { spacing, borderRadius, shadows, fonts } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Floating dot — rises from bottom with fade in/out
function FloatingDot({ left, size, delay, color, duration }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay, duration]);

  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -700],
  });
  const opacity = v.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.6, 0.4, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

// Animated number counter
function useCountUp(target, duration = 1200, delay = 200) {
  const v = useRef(new Animated.Value(0)).current;
  const [val, setVal] = useState(0);

  useEffect(() => {
    const listener = v.addListener(({ value }) => {
      setVal(Math.round(value * target));
    });
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => v.removeListener(listener);
  }, [v, target, duration, delay]);

  return val;
}

// Draw-in sparkline (12 fake points)
function PreviewSparkline({ color, height = 50, width = 300 }) {
  const points = useMemo(() => [25, 38, 22, 34, 29, 45, 33, 40, 28, 36, 24, 30], []);
  const p = 4;
  const min = Math.min(...points), max = Math.max(...points);
  const step = (width - p * 2) / (points.length - 1);
  const xs = points.map((_, i) => p + i * step);
  const ys = points.map(v => height - p - ((v - min) / (max - min || 1)) * (height - p * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const areaPath = `${path} L ${xs[xs.length - 1].toFixed(1)} ${height} L ${xs[0].toFixed(1)} ${height} Z`;

  // measure path length once (approximate from points)
  const pathLength = useMemo(() => {
    let len = 0;
    for (let i = 1; i < xs.length; i++) {
      len += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    }
    return len;
  }, [xs, ys]);

  const dash = useRef(new Animated.Value(pathLength)).current;

  useEffect(() => {
    Animated.timing(dash, {
      toValue: 0,
      duration: 1400,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dash, pathLength]);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="pSparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#pSparkFill)" />
      <AnimatedPath
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dash}
      />
      <Circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill={color} />
      <Circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="6" fill={color} opacity="0.25" />
    </Svg>
  );
}

// pulsing dot for eyebrow
function PulseDot({ color }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.1] });
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Animated.View
        style={{
          position: 'absolute',
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
    </View>
  );
}

export default function WelcomeScreen({ onLogin, onSignup }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const balanceVal = useCountUp(77000, 1200, 400);

  // Generate 14 dots
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * SCREEN_W,
        size: 3 + Math.random() * 7,
        delay: Math.random() * 4000,
        duration: 7000 + Math.random() * 4000,
      })),
    []
  );

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, paddingBottom: spacing.xl },

    // top bar
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    logoMark: {
      width: 40, height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...shadows.sm,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
    },
    logoMarkText: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.textInverse,
    },
    wordmark: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },

    // hero
    heroBlock: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    h1: {
      fontFamily: fonts.displayBold,
      fontSize: 38,
      color: colors.textPrimary,
      letterSpacing: -1.4,
      lineHeight: 44,
      marginBottom: spacing.md,
    },
    h1Italic: {
      fontFamily: fonts.displayMedium,
      fontStyle: 'italic',
      color: colors.primary,
    },
    sub: {
      fontFamily: fonts.sansRegular,
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },

    // preview teaser
    teaser: {
      marginHorizontal: spacing.lg,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      borderRadius: 24,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? '#233050' : colors.border,
      overflow: 'hidden',
      ...shadows.md,
    },
    teaserEyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    teaserEyebrow: {
      fontFamily: fonts.sansBold,
      fontSize: 10.5,
      color: colors.textTertiary,
      letterSpacing: 0.14,
      textTransform: 'uppercase',
    },
    teaserAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 10,
    },
    teaserCurrency: {
      fontFamily: fonts.displayMedium,
      fontSize: 22,
      color: colors.textTertiary,
    },
    teaserAmount: {
      fontFamily: fonts.displayBold,
      fontSize: 38,
      color: colors.textPrimary,
      letterSpacing: -1.5,
    },

    // pillars
    pillarsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    pillar: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    pillarValue: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.primary,
      letterSpacing: -0.6,
    },
    pillarLabel: {
      fontFamily: fonts.sans,
      fontSize: 11,
      color: colors.textTertiary,
      lineHeight: 15,
    },

    // CTAs
    ctaContainer: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
      gap: 10,
    },
    primaryCta: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
    },
    primaryCtaText: {
      fontFamily: fonts.sansBold,
      fontSize: 15.5,
      color: colors.textInverse,
      letterSpacing: 0.2,
    },
    secondaryCta: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.full,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryCtaText: {
      fontFamily: fonts.sansSemi,
      fontSize: 14.5,
      color: colors.textPrimary,
    },
    microcopy: {
      fontFamily: fonts.sans,
      fontSize: 11,
      color: colors.textQuaternary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  }), [colors, isDark]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background glows */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -100, left: SCREEN_W / 2 - 250, width: 500, height: 350 }}>
        <Svg width={500} height={350}>
          <Defs>
            <RadialGradient id="wgTop" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.22" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={500} height={350} fill="url(#wgTop)" />
        </Svg>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -50, right: -80, width: 450, height: 350 }}>
        <Svg width={450} height={350}>
          <Defs>
            <RadialGradient id="wgBot" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.info} stopOpacity="0.14" />
              <Stop offset="100%" stopColor={colors.info} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={450} height={350} fill="url(#wgBot)" />
        </Svg>
      </View>

      {/* Floating dots */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        {dots.map(d => (
          <FloatingDot
            key={d.id}
            left={d.left}
            size={d.size}
            delay={d.delay}
            duration={d.duration}
            color={colors.primary}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>P</Text>
          </View>
          <Text style={styles.wordmark}>Plata</Text>
        </View>

        {/* Hero text */}
        <View style={styles.heroBlock}>
          <Text style={styles.h1}>
            Sabé a dónde{' '}
            <Text style={styles.h1Italic}>se va</Text>
            {' '}tu plata.
          </Text>
          <Text style={styles.sub}>
            Una app simple para registrar gastos, ver para dónde se va el sueldo y no llegar justo a fin de mes.
          </Text>
        </View>

        {/* Preview teaser */}
        <View style={styles.teaser}>
          {/* glow */}
          <View pointerEvents="none" style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200 }}>
            <Svg width={200} height={200}>
              <Defs>
                <RadialGradient id="wgTeaser" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={200} height={200} fill="url(#wgTeaser)" />
            </Svg>
          </View>

          <View style={styles.teaserEyebrowRow}>
            <PulseDot color={colors.primary} />
            <Text style={styles.teaserEyebrow}>Vista previa · Mayo</Text>
          </View>
          <View style={styles.teaserAmountRow}>
            <Text style={styles.teaserCurrency}>$</Text>
            <Text style={styles.teaserAmount}>
              {balanceVal.toLocaleString('es-AR')}
            </Text>
          </View>
          <PreviewSparkline color={colors.primary} />
        </View>

        {/* Pillars grid */}
        <View style={styles.pillarsRow}>
          <View style={styles.pillar}>
            <Text style={styles.pillarValue}>8s</Text>
            <Text style={styles.pillarLabel}>Para cargar un gasto</Text>
          </View>
          <View style={styles.pillar}>
            <Text style={styles.pillarValue}>$0</Text>
            <Text style={styles.pillarLabel}>Para siempre</Text>
          </View>
          <View style={styles.pillar}>
            <Text style={[styles.pillarValue, { fontSize: 24 }]}>∞</Text>
            <Text style={styles.pillarLabel}>Categorías y presupuestos</Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryCta} onPress={onSignup} activeOpacity={0.85}>
            <Text style={styles.primaryCtaText}>Empezar gratis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryCta} onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.secondaryCtaText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
          <Text style={styles.microcopy}>Sin tarjeta · Sin anuncios · Datos cifrados</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
