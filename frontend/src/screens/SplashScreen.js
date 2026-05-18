import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { fonts } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

// Orbit ring with a dot on the perimeter, rotating
function Orbit({ size, duration, reverse, color }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [v, duration]);

  const rotate = v.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orbit,
        {
          width: size, height: size,
          borderRadius: size / 2,
          borderColor: color + '26',
          transform: [{ rotate }],
        },
      ]}
    >
      <View style={[styles.orbitDot, { backgroundColor: color }]} />
    </Animated.View>
  );
}

export default function SplashScreen({ onFinish }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // Logo morph
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoRadius = useRef(new Animated.Value(0)).current; // 0=circle, 1=square
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslate = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(8)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance — native-driven (transforms)
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1100,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1100,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
    ]).start();

    // Logo border-radius morph — JS-driven (borderRadius isn't native-animatable)
    Animated.timing(logoRadius, {
      toValue: 1,
      duration: 1100,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: false,
    }).start();

    // Glow scale + fade
    Animated.parallel([
      Animated.timing(glowScale, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Name fade-up @ 400ms
    Animated.parallel([
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(nameTranslate, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fade-up @ 1s
    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslate, {
        toValue: 0,
        duration: 600,
        delay: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Exit @ 1900ms (800ms duration)
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.06,
          duration: 800,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish?.();
      });
    }, 1900);

    return () => clearTimeout(exitTimer);
  }, [
    logoScale, logoRotate, logoRadius,
    nameOpacity, nameTranslate, taglineOpacity, taglineTranslate,
    glowScale, glowOpacity, screenOpacity, screenScale, onFinish,
  ]);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });
  const logoRadiusValue = logoRadius.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 26],
  });

  const bg = isDark ? '#0D1420' : '#F7F9F5';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      {/* Background radial glow */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 400, height: 400,
          left: SCREEN_W / 2 - 200,
          top: '50%',
          marginTop: -200,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      >
        <Svg width={400} height={400}>
          <Defs>
            <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.32" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={400} height={400} fill="url(#splashGlow)" />
        </Svg>
      </Animated.View>

      {/* Orbits */}
      <View style={styles.center} pointerEvents="none">
        <Orbit size={200} duration={5000} reverse={false} color={colors.primary} />
      </View>
      <View style={styles.center} pointerEvents="none">
        <Orbit size={260} duration={7000} reverse={true} color={colors.primary} />
      </View>

      {/* Logo — outer wrapper handles transform (native), inner handles borderRadius (JS) */}
      <View style={styles.center}>
        <Animated.View
          style={{
            transform: [
              { scale: logoScale },
              { rotate: logoRotateInterpolate },
            ],
          }}
        >
          <Animated.View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.primary,
                borderRadius: logoRadiusValue,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.logoText, { color: colors.textInverse }]}>P</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* App name — Text estático envuelto en Animated.View para que
          Android mida el ancho del glifo correctamente (Animated.Text
          con letterSpacing negativo a veces clipea el último carácter). */}
      <Animated.View
        style={{
          opacity: nameOpacity,
          transform: [{ translateY: nameTranslate }],
          marginTop: 130,
        }}
      >
        <Text style={[styles.appName, { color: colors.textPrimary }]}>
          Plata
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={[
          { position: 'absolute', bottom: 60 },
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        <Text style={[styles.tagline, { color: colors.textQuaternary }]}>
          TU ECONOMÍA, ORDENADA
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    borderWidth: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orbitDot: {
    width: 8, height: 8, borderRadius: 4,
    marginRight: -4,
  },
  logoBadge: {
    width: 88, height: 88,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 10,
  },
  logoText: {
    fontFamily: fonts.displayBold,
    fontSize: 52,
    letterSpacing: -1.5,
  },
  appName: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    letterSpacing: -0.6,
    textAlign: 'center',
    includeFontPadding: false,
    paddingHorizontal: 12,
  },
  tagline: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.16,
  },
});
