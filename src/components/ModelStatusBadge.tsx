/**
 * ModelStatusBadge — Displays current model info in the UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { useEngineStore } from '../engine/TranslationEngineProvider';
import { MODEL_VARIANTS } from '../engine/model-constants';

export function ModelStatusBadge() {
  const { currentVariant, isLoading } = useEngineStore();
  const variantInfo = MODEL_VARIANTS.find(v => v.name === currentVariant);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: isLoading ? colors.status.loading : colors.status.ready }]} />
      <Text style={styles.text}>
        TranslatePsy-EuroNano · {currentVariant} · INT8
      </Text>
      {variantInfo && (
        <Text style={styles.size}>{variantInfo.sizeInt8}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  size: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
  },
});

export default ModelStatusBadge;
