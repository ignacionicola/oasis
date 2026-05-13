import React, { useRef, useEffect } from 'react';
import { View, PanResponder, AppState } from 'react-native';
import { useSettings } from '../context/SettingsContext';

const TAB_NAMES = ['Home', 'Stats', 'History', 'Settings'];

export default function SwipeableScreen({ children, navigation, currentIndex, totalTabs }) {
  const { settings } = useSettings();
  const isBlocked = useRef(false);
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    isModalOpenRef.current = settings.isModalOpen === true;
  }, [settings.isModalOpen]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        isBlocked.current = true;
      } else if (state === 'active') {
        setTimeout(() => {
          isBlocked.current = false;
        }, 2000);
      }
    });
    return () => sub.remove();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isModalOpenRef.current) return false;
        if (isBlocked.current) return false;
        const { dx, dy } = gestureState;
        if (Math.abs(dx) < 40) return false;
        if (Math.abs(dx) < Math.abs(dy) * 2.5) return false;
        return true;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (isModalOpenRef.current) return;
        if (isBlocked.current) return;
        const { dx, vx } = gestureState;
        if (dx < -80 && vx < -0.3 && currentIndex < totalTabs - 1) {
          navigation.navigate(TAB_NAMES[currentIndex + 1]);
        } else if (dx > 80 && vx > 0.3 && currentIndex > 0) {
          navigation.navigate(TAB_NAMES[currentIndex - 1]);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
