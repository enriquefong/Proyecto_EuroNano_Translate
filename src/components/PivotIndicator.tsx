/**
 * PivotIndicator — Visual route indicator for translations
 *
 * Shows the translation path with animated dots, highlighting
 * when a pivot through English is being used.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import type { TranslationRoute } from '../engine/pivot-router';
import { estimateRouteQuality, getQualityLabel } from '../engine/pivot-router';

interface PivotIndicatorProps {
  route: TranslationRoute | null;
  isTranslating?: boolean;
}

export function PivotIndicator({ route, isTranslating = false }: PivotIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTranslating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.timing(dotAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
      ).start();
    } else {
      pulseAnim.setValue(1);
      dotAnim.setValue(0);
    }
  }, [isTranslating]);

  if (!route) return null;

  const quality = estimateRouteQuality(route);
  const qualityInfo = getQualityLabel(quality);

  return (
    <Animated.View style={[styles.container, { opacity: pulseAnim }]}>
      <View style={styles.routeRow}>
        {/* Source language */}
        <View style={[styles.langBadge, { borderColor: colors.language.source + '50' }]}>
          <Text style={styles.langFlag}>{route.srcLang.flag}</Text>
          <Text style={[styles.langCode, { color: colors.language.source }]}>
            {route.srcLang.code.toUpperCase()}
          </Text>
        </View>

        {/* Arrow / dots */}
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowLine, { backgroundColor: colors.language.source + '30' }]} />
          <Text style={styles.arrow}>→</Text>
        </View>

        {/* Pivot language (if applicable) */}
        {route.requiresPivot && route.pivotLang && (
          <>
            <View style={[styles.langBadge, styles.pivotBadge, { borderColor: colors.language.pivot + '50' }]}>
              <Text style={styles.langFlag}>{route.pivotLang.flag}</Text>
              <Text style={[styles.langCode, { color: colors.language.pivot }]}>
                {route.pivotLang.code.toUpperCase()}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <View style={[styles.arrowLine, { backgroundColor: colors.language.pivot + '30' }]} />
              <Text style={[styles.arrow, { color: colors.language.pivot }]}>→</Text>
            </View>
          </>
        )}

        {/* Target language */}
        <View style={[styles.langBadge, { borderColor: colors.language.target + '50' }]}>
          <Text style={styles.langFlag}>{route.dstLang.flag}</Text>
          <Text style={[styles.langCode, { color: colors.language.target }]}>
            {route.dstLang.code.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Metadata row */}
      <View style={styles.metaRow}>
        {route.requiresPivot && (
          <View style={[styles.pivotLabel, { backgroundColor: colors.language.pivot + '15' }]}>
            <Text style={[styles.pivotText, { color: colors.language.pivot }]}>⟳ Pivote por inglés</Text>
          </View>
        )}
        <View style={[styles.qualityBadge, { backgroundColor: qualityInfo.color + '15' }]}>
          <Text style={[styles.qualityText, { color: qualityInfo.color }]}>
            {qualityInfo.emoji} {qualityInfo.label} ({Math.round(quality * 100)}%)
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.glass.bg,
    gap: spacing.xs,
  },
  pivotBadge: {
    backgroundColor: colors.language.pivot + '08',
  },
  langFlag: {
    fontSize: 16,
  },
  langCode: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    height: 1,
    width: 20,
  },
  arrow: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pivotLabel: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pivotText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
  },
  qualityBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  qualityText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
  },
});

export default PivotIndicator;
