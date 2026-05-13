import React, { useRef, useEffect } from 'react';
import { View, PanResponder, AppState } from 'react-native';

const TAB_NAMES = ['Home', 'Stats', 'History', 'Settings'];

export default function SwipeableScreen({ children, navigation, currentIndex, totalTabs }) {
  const isPickerOpen = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        isPickerOpen.current = true;
      } else if (state === 'active') {
        setTimeout(() => {
          isPickerOpen.current = false;
        }, 500);
      }
    });
    return () => sub.remove();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isPickerOpen.current) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isPickerOpen.current) return;
        const { dx, vx } = gestureState;
        if (dx < -50 && vx < -0.5 && currentIndex < totalTabs - 1) {
          navigation.navigate(TAB_NAMES[currentIndex + 1]);
        } else if (dx > 50 && vx > 0.5 && currentIndex > 0) {
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
