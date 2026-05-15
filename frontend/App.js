import React, { useEffect, useCallback } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View, ActivityIndicator } from 'react-native';
import { SettingsProvider } from './src/context/SettingsContext';
import { useSettings } from './src/context/SettingsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import useTranslation from './src/i18n';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AuthScreen from './src/screens/AuthScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createMaterialTopTabNavigator();

function AppNavigator() {
  const { settings, loaded } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslation();
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const bg = isDark ? '#0D1420' : '#F7F9F5';
    SystemUI.setBackgroundColorAsync(bg);
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
  }, [isDark]);

  const bgColor = isDark ? '#0D1420' : '#F7F9F5';
  const surfaceColor = isDark ? '#111F35' : '#FFFFFF';
  const accentColor = isDark ? '#BFEF35' : '#6BAE12';
  const inactiveColor = isDark ? '#7888A0' : '#8899AA';
  const borderColor = isDark ? '#233050' : '#EBF0F6';

  const onLayoutReady = useCallback(async () => {
    if (loaded && !authLoading) await SplashScreen.hideAsync();
  }, [loaded, authLoading]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }} onLayout={onLayoutReady}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }} onLayout={onLayoutReady}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }} onLayout={onLayoutReady}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Tab.Navigator
          tabBarPosition="bottom"
          swipeEnabled={true}
          screenOptions={({ route }) => ({
            tabBarShowLabel: true,
            tabBarShowIcon: true,
            tabBarActiveTintColor: accentColor,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIndicatorStyle: {
              backgroundColor: 'transparent',
              height: 0,
            },
            tabBarStyle: {
              backgroundColor: surfaceColor,
              borderTopWidth: 1,
              borderTopColor: borderColor,
              height: 70,
              paddingBottom: 10,
              paddingTop: 2,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 0.2,
              textTransform: 'none',
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: t.tabs.home,
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="home" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarLabel: t.tabs.stats,
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="bar-chart" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarLabel: t.tabs.history,
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="history" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: t.tabs.settings,
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="settings" size={24} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

function ThemedRoot() {
  const { settings } = useSettings();
  const bgColor = settings.theme === 'dark' ? '#0D1420' : '#F7F9F5';
  return (
    <SafeAreaProvider style={{ backgroundColor: bgColor }}>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemedRoot />
      </SettingsProvider>
    </AuthProvider>
  );
}
