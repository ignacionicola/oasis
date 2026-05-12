import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';

const TAB_NAMES = ['Home', 'Stats', 'History', 'Settings'];

export default function SwipeableScreen({ children, navigation, currentIndex, totalTabs }) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2;
      },
      onPanResponderRelease: (_, gestureState) => {
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
