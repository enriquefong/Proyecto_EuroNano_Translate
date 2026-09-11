/**
 * SettingsScreen — App configuration, model info, and about page
 *
 * Features:
 * - Quality vs Speed selector (Tiny/BaseMemory/Base)
 * - Model info panel (name, quantization, benchmarks)
 * - Performance log viewer
 * - Privacy & limitations info
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, glassStyles } from '../theme/theme';
import { useEngineStore } from '../engine/TranslationEngineProvider';
import { MODEL_VARIANTS, type ModelVariant, SUPPORTED_LANGUAGES } from '../engine/model-constants';
import { getLogSummary, exportAsJsonl } from '../engine/perf-logger';

export function SettingsScreen() {
  const { currentVariant, setVariant, autoPlayTts, setAutoPlayTts } = useEngineStore();
  const [showAbout, setShowAbout] = useState(false);
  const logSummary = getLogSummary();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        {/* Model Variant Selector */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs }}>
            <Feather name="zap" size={20} color={colors.accent.primary} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Calidad vs Velocidad</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Selecciona la variante del modelo según tu dispositivo
          </Text>

          <View style={styles.variantList}>
            {MODEL_VARIANTS.map(variant => (
              <TouchableOpacity
                key={variant.name}
                style={[
                  styles.variantCard,
                  currentVariant === variant.name && styles.variantCardActive,
                ]}
                onPress={() => setVariant(variant.name)}
                activeOpacity={0.7}
              >
                <View style={styles.variantHeader}>
                  <View style={styles.variantNameRow}>
                    <Text style={[
                      styles.variantName,
                      currentVariant === variant.name && styles.variantNameActive,
                    ]}>
                      {variant.name}
                    </Text>
                    {variant.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recomendado</Text>
                      </View>
                    )}
                  </View>
                  {currentVariant === variant.name && (
                    <Feather name="check" size={20} color={colors.accent.primary} />
                  )}
                </View>

                <Text style={styles.variantDescription}>{variant.description}</Text>

                <View style={styles.variantStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Params</Text>
                    <Text style={styles.statValue}>{variant.params}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Tamaño</Text>
                    <Text style={styles.statValue}>{variant.sizeInt8}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Velocidad</Text>
                    <Text style={styles.statValue}>{variant.androidThroughput} f/s</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs }}>
            <Feather name="settings" size={20} color={colors.accent.primary} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>General</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reproducción automática</Text>
              <Text style={styles.settingDescription}>
                Reproducir traducción por voz automáticamente
              </Text>
            </View>
            <Switch
              value={autoPlayTts}
              onValueChange={setAutoPlayTts}
              trackColor={{
                false: colors.bg.elevated,
                true: colors.accent.primary + '40',
              }}
              thumbColor={autoPlayTts ? colors.accent.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* Performance Log */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs }}>
            <Feather name="activity" size={20} color={colors.accent.primary} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Rendimiento</Text>
          </View>

          <View style={styles.perfCard}>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Eventos registrados</Text>
              <Text style={styles.perfValue}>{logSummary.totalEvents}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Traducciones</Text>
              <Text style={styles.perfValue}>{logSummary.byType.nmt_translate}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Transcripciones</Text>
              <Text style={styles.perfValue}>{logSummary.byType.asr_transcribe}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Latencia media NMT</Text>
              <Text style={styles.perfValue}>
                {logSummary.avgLatency.nmt_translate > 0
                  ? `${Math.round(logSummary.avgLatency.nmt_translate)}ms`
                  : '—'}
              </Text>
            </View>

            <TouchableOpacity style={[styles.exportButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
              <Feather name="download" size={18} color={colors.accent.primary} />
              <Text style={styles.exportText}>Exportar log JSONL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About the Model */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aboutToggle}
            onPress={() => setShowAbout(!showAbout)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="cpu" size={20} color={colors.text.primary} />
              <Text style={styles.sectionTitle}>Acerca del modelo</Text>
            </View>
            <Feather name={showAbout ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          {showAbout && (
            <View style={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Modelo</Text>
                <Text style={styles.aboutValue}>qvac/TranslatePsy-EuroNano</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Arquitectura</Text>
                <Text style={styles.aboutValue}>Marian/Bergamot (6-layer Transformer + SSRU)</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Cuantización</Text>
                <Text style={styles.aboutValue}>INTGEMM INT8</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Variante activa</Text>
                <Text style={[styles.aboutValue, { color: colors.accent.primary }]}>
                  {currentVariant}
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Vocabulario</Text>
                <Text style={styles.aboutValue}>SentencePiece 32k compartido</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Calidad (COMET)</Text>
                <Text style={styles.aboutValue}>
                  xx→en: 0.860 | en→xx: 0.826
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Licencia</Text>
                <Text style={styles.aboutValue}>Apache-2.0</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Motor de inferencia</Text>
                <Text style={styles.aboutValue}>Bergamot NMT vía @qvac/sdk</Text>
              </View>

              <View style={styles.aboutDivider} />

              <Text style={styles.aboutSectionLabel}>Idiomas soportados</Text>
              <View style={styles.languageGrid}>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <View key={lang.code} style={styles.languageChip}>
                    <Text style={styles.languageChipFlag}>{lang.flag}</Text>
                    <Text style={styles.languageChipName}>{lang.nativeName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <View style={styles.privacyCard}>
            <Feather name="lock" size={28} color={colors.accent.success} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.privacyTitle}>100% Local y Privado</Text>
            <Text style={styles.privacyText}>
              Toda la traducción, transcripción y síntesis de voz se ejecutan
              en tu dispositivo. Ni el audio ni el texto salen del teléfono.
              Funciona completamente sin conexión a internet tras la descarga
              inicial de los modelos.
            </Text>
          </View>
        </View>

        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>EuroNano Translate v1.0.0</Text>
          <Text style={styles.versionText}>Apache-2.0 · Hackathon QVAC</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['5xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginBottom: spacing.base,
  },
  variantList: {
    gap: spacing.md,
  },
  variantCard: {
    ...glassStyles.card,
    padding: spacing.base,
  },
  variantCardActive: {
    ...glassStyles.cardActive,
    borderColor: colors.accent.primary + '40',
    backgroundColor: colors.accent.primary + '08',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  variantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  variantName: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  variantNameActive: {
    color: colors.accent.primary,
  },
  recommendedBadge: {
    backgroundColor: colors.accent.success + '15',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: typography.sizes.xs,
    color: colors.accent.success,
    fontFamily: typography.fonts.bold,
  },
  checkmark: {
    fontSize: 18,
    color: colors.accent.primary,
    fontFamily: typography.fonts.bold,
  },
  variantDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  variantStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg.primary + '80',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...glassStyles.card,
    padding: spacing.base,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
    marginTop: 2,
  },
  perfCard: {
    ...glassStyles.card,
    padding: spacing.base,
    gap: spacing.sm,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
  perfValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  exportButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    alignItems: 'center',
  },
  exportText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.primary,
    fontFamily: typography.fonts.medium,
  },
  aboutToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleArrow: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  aboutCard: {
    ...glassStyles.card,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  aboutLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.medium,
    flex: 1,
  },
  aboutValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    flex: 1.5,
    textAlign: 'right',
  },
  aboutDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  aboutSectionLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.sm,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary + '80',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  languageChipFlag: {
    fontSize: 16,
  },
  languageChipName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  privacyCard: {
    backgroundColor: colors.accent.success + '08',
    borderWidth: 1,
    borderColor: colors.accent.success + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  privacyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  privacyTitle: {
    fontSize: typography.sizes.md,
    color: colors.accent.success,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.sm,
  },
  privacyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  versionText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
  },
});

export default SettingsScreen;
