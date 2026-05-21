import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { SettingsProvider } from './src/context/SettingsContext';
import { useSettings } from './src/context/SettingsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import useTranslation from './src/i18n';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AuthScreen from './src/screens/AuthScreen';
import SplashScreenComponent from './src/screens/SplashScreen';
import RecurringScreen from './src/screens/RecurringScreen';
import CustomTabBar from './src/components/CustomTabBar';

SplashScreen.preventAutoHideAsync();

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const t = useTranslation();
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      swipeEnabled={true}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarIndicatorStyle: { height: 0 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t.tabs.home }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: t.tabs.stats }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t.tabs.history }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t.tabs.settings }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { settings, loaded } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const isDark = settings.theme === 'dark';

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    const bg = isDark ? '#0D1420' : '#F7F9F5';
    SystemUI.setBackgroundColorAsync(bg);
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync(isDark ? '#111F35' : 'transparent');
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
  }, [isDark]);

  const bgColor = isDark ? '#0D1420' : '#F7F9F5';
  const accentColor = isDark ? '#BFEF35' : '#6BAE12';

  useEffect(() => {
    if (loaded && !authLoading && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, authLoading, fontsLoaded]);

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="Recurring" component={RecurringScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

function ThemedRoot() {
  const { settings } = useSettings();
  const bgColor = settings.theme === 'dark' ? '#0D1420' : '#F7F9F5';
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider style={{ backgroundColor: bgColor }}>
      <AppNavigator />
      {showSplash && <SplashScreenComponent onFinish={() => setShowSplash(false)} />}
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
