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

const TAB_ICONS = {
  Home: 'home',
  Stats: 'bar-chart',
  History: 'history',
  Settings: 'settings',
};

function AppNavigator() {
  const { settings, loaded } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslation();
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const bg = isDark ? '#111F35' : '#FFFFFF';
    SystemUI.setBackgroundColorAsync(bg);
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
  }, [isDark]);

  const bgColor = isDark ? '#111F35' : '#FFFFFF';

  const onLayoutReady = useCallback(async () => {
    if (loaded && !authLoading) await SplashScreen.hideAsync();
  }, [loaded, authLoading]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }} onLayout={onLayoutReady}>
        <ActivityIndicator size="large" color={isDark ? '#1D9E75' : '#0D6B4F'} />
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
            tabBarActiveTintColor: isDark ? '#1D9E75' : '#0D6B4F',
            tabBarInactiveTintColor: '#8E9BB3',
            tabBarIndicatorStyle: {
              backgroundColor: 'transparent',
              height: 0,
            },
            tabBarStyle: {
              backgroundColor: isDark ? '#111F35' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: isDark ? '#162540' : '#F0F3F7',
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
            tabBarIcon: ({ color }) => (
              <MaterialIcons name={TAB_ICONS[route.name]} size={24} color={color} />
            ),
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t.tabs.home }} />
          <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: t.tabs.stats }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t.tabs.history }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t.tabs.settings }} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

function ThemedRoot() {
  const { settings } = useSettings();
  const bgColor = settings.theme === 'dark' ? '#111F35' : '#FFFFFF';
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
