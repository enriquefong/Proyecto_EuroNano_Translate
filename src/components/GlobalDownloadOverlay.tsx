import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEngineStore } from '../engine/TranslationEngineProvider';
import { colors, typography, spacing, borderRadius, glassStyles } from '../theme/theme';

export function GlobalDownloadOverlay() {
  const { isLoading, loadingMessage, downloadProgress } = useEngineStore();

  if (!isLoading) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, glassStyles.modal]}>
        <Text style={styles.title}>{loadingMessage || 'Cargando IA...'}</Text>
        
        {downloadProgress > 0 && (
          <>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(downloadProgress * 100)}% Completado
            </Text>
            <Text style={styles.warningText}>
              Por favor, no cierres la aplicación. La descarga inicial puede tomar algunos minutos dependiendo de tu conexión a internet.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.semibold,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
  },
});
