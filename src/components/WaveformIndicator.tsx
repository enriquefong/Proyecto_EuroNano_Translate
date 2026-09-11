/**
 * WaveformIndicator — Animated audio waveform visualization
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme/theme';

interface WaveformIndicatorProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export function WaveformIndicator({
  isActive,
  color = colors.accent.primary,
  barCount = 5,
  height = 40,
}: WaveformIndicatorProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isActive) {
      const anims = animations.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 200 + Math.random() * 300,
              useNativeDriver: true,
              delay: i * 80,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 200 + Math.random() * 300,
              useNativeDriver: true,
            }),
          ]),
        )
      );
      anims.forEach(a => a.start());

      return () => {
        anims.forEach(a => a.stop());
      };
    } else {
      animations.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isActive]);

  return (
    <View style={[styles.container, { height }]}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height,
              transform: [{ scaleY: anim }],
              opacity: isActive ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

export default WaveformIndicator;
