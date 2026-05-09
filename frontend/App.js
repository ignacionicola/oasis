import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Inicio: 'home',
  Estadísticas: 'bar-chart',
  Presupuestos: 'account-balance-wallet',
};

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
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
            tabBarActiveTintColor: '#0D6B4F',
            tabBarInactiveTintColor: '#8E9BB3',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F0F3F7',
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
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Estadísticas" component={StatsScreen} />
          <Tab.Screen name="Presupuestos" component={BudgetsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
