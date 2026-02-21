import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = '#FBBF24',
  trackColor = 'rgba(255,255,255,0.08)',
  height = 8,
}: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(100, Math.max(0, progress)),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, height, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 4,
  },
});
