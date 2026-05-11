import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './src/context/SettingsContext';
import { useSettings } from './src/context/SettingsContext';
import useTranslation from './src/i18n';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Stats: 'bar-chart',
  History: 'history',
  Settings: 'settings',
};

function AppNavigator() {
  const { settings } = useSettings();
  const t = useTranslation();
  const isDark = settings.theme === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name={TAB_ICONS[route.name]}
                size={size}
                color={color}
              />
            ),
            tabBarActiveTintColor: isDark ? '#1D9E75' : '#0D6B4F',
            tabBarInactiveTintColor: '#8E9BB3',
            tabBarStyle: {
              backgroundColor: isDark ? '#111F35' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: isDark ? '#162540' : '#F0F3F7',
              paddingTop: 4,
              height: 56,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 0.2,
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ tabBarLabel: t.tabs.home }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{ tabBarLabel: t.tabs.stats }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{ tabBarLabel: t.tabs.history }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ tabBarLabel: t.tabs.settings }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </SettingsProvider>
  );
}
