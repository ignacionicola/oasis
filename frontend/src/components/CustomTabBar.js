import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { spacing, fonts, shadows } from '../theme';

const ICONS = {
  Home: 'home',
  Stats: 'bar-chart',
  History: 'history',
  Settings: 'settings',
};

function TabButton({ route, isFocused, onPress, onLayout, label, colors, isDark }) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.1 : 1,
      stiffness: 280,
      damping: 14,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  const iconName = ICONS[route.name] || 'circle';
  const color = isFocused ? colors.primary : (isDark ? '#7888A0' : '#8899AA');

  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={styles.tabBtn}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', gap: 3 }}>
        <MaterialIcons name={iconName} size={22} color={color} />
        <Text style={[
          styles.tabLabel,
          { color, fontFamily: isFocused ? fonts.sansBold : fonts.sansSemi },
        ]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const [layouts, setLayouts] = useState({});
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const activeRoute = state.routes[state.index];
  const activeLayout = layouts[activeRoute.key];

  useEffect(() => {
    if (!activeLayout) return;
    Animated.parallel([
      Animated.spring(indicatorLeft, {
        toValue: activeLayout.x,
        stiffness: 300,
        damping: 22,
        mass: 0.9,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorWidth, {
        toValue: activeLayout.width,
        stiffness: 300,
        damping: 22,
        mass: 0.9,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, indicatorLeft, indicatorWidth]);

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios'
    ? { intensity: 50, tint: isDark ? 'dark' : 'light' }
    : {};

  return (
    <View
      pointerEvents="box-none"
      style={styles.outerWrap}
    >
      <Container
        {...containerProps}
        style={[
          styles.bar,
          {
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(15, 30, 52, 0.78)' : 'rgba(255, 255, 255, 0.85)')
              : (isDark ? '#111F35' : '#FFFFFF'),
            borderColor: isDark ? '#233050' : '#EBF0F6',
          },
        ]}
      >
        {/* Animated indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              left: indicatorLeft,
              width: indicatorWidth,
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary + '55',
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setLayouts(prev => ({ ...prev, [route.key]: { x, width } }));
              }}
              colors={colors}
              isDark={isDark}
            />
          );
        })}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingTop: 4,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    overflow: 'hidden',
    ...shadows.md,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
});
