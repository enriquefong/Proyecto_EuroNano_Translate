/**
 * TextModeScreen — Google Translate-style text translation
 *
 * Features:
 * - Language selector with swap button
 * - Streaming incremental translation (debounce 400ms)
 * - Pivot route indicator
 * - TTS playback for both source and result
 * - Translation history
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows, glassStyles } from '../theme/theme';
import { LanguageSelector } from '../components/LanguageSelector';
import { PivotIndicator } from '../components/PivotIndicator';
import { ModelStatusBadge } from '../components/ModelStatusBadge';
import { useEngine } from '../engine/TranslationEngineProvider';
import { LANGUAGE_MAP, type Language } from '../engine/model-constants';
import type { TranslationRoute } from '../engine/pivot-router';

const DEBOUNCE_MS = 400;

export function TextModeScreen() {
  const engine = useEngine();
  const [srcLang, setSrcLang] = useState<Language>(LANGUAGE_MAP['es']);
  const [dstLang, setDstLang] = useState<Language>(LANGUAGE_MAP['en']);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [intermediateText, setIntermediateText] = useState<string | undefined>();
  const [isTranslating, setIsTranslating] = useState(false);
  const [route, setRoute] = useState<TranslationRoute | null>(null);
  const [totalMs, setTotalMs] = useState(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapAnim = useRef(new Animated.Value(0)).current;

  // Update route whenever languages change
  useEffect(() => {
    if (srcLang.code !== dstLang.code) {
      const newRoute = engine.getRoute(srcLang.code, dstLang.code);
      setRoute(newRoute);
    }
  }, [srcLang.code, dstLang.code]);

  // Debounced translation
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!text.trim()) {
      setTranslatedText('');
      setIntermediateText(undefined);
      setTotalMs(0);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsTranslating(true);
        const result = await engine.translateText(
          text,
          srcLang.code,
          dstLang.code,
          (partial) => {
            setTranslatedText(partial);
          },
        );
        setTranslatedText(result.translatedText);
        setIntermediateText(result.intermediateText);
        setTotalMs(result.totalMs);
      } catch (err) {
        console.error('[TextMode] Translation error:', err);
      } finally {
        setIsTranslating(false);
      }
    }, DEBOUNCE_MS);
  }, [srcLang.code, dstLang.code, engine]);

  // Swap languages
  const handleSwap = useCallback(() => {
    Animated.sequence([
      Animated.timing(swapAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(swapAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const tempLang = srcLang;
    setSrcLang(dstLang);
    setDstLang(tempLang);

    // Swap text too
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  }, [srcLang, dstLang, inputText, translatedText]);

  const handlePlayTTS = useCallback(async (text: string, lang: string) => {
    try {
      await engine.synthesizeSpeech(text, lang);
    } catch (err) {
      console.error('[TextMode] TTS error:', err);
    }
  }, [engine]);

  const swapRotation = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Traducir</Text>
            <Text style={styles.subtitle}>Texto</Text>
          </View>

          <ModelStatusBadge />

          {/* Language selectors with swap */}
          <View style={styles.languageRow}>
            <View style={styles.langSelectorWrapper}>
              <LanguageSelector
                selectedCode={srcLang.code}
                onSelect={setSrcLang}
                label="ORIGEN"
                excludeCode={dstLang.code}
                accentColor={colors.language.source}
              />
            </View>

            <Animated.View style={{ transform: [{ rotate: swapRotation }] }}>
              <TouchableOpacity
                style={styles.swapButton}
                onPress={handleSwap}
                activeOpacity={0.7}
              >
                <Feather name="refresh-cw" size={20} color={colors.language.swap} />
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.langSelectorWrapper}>
              <LanguageSelector
                selectedCode={dstLang.code}
                onSelect={setDstLang}
                label="DESTINO"
                excludeCode={srcLang.code}
                accentColor={colors.language.target}
              />
            </View>
          </View>

          {/* Pivot indicator */}
          <PivotIndicator route={route} isTranslating={isTranslating} />

          {/* Input area */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>
                {srcLang.flag} {srcLang.nativeName}
              </Text>
              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={() => handlePlayTTS(inputText, srcLang.code)}
                  style={styles.ttsButton}
                >
                  <Feather name="volume-2" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Escribe el texto a traducir..."
              placeholderTextColor={colors.text.placeholder}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
            />

            {inputText.length > 0 && (
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{inputText.length} caracteres</Text>
                <TouchableOpacity
                  onPress={() => { setInputText(''); setTranslatedText(''); }}
                  style={[styles.clearButton, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                >
                  <Feather name="x" size={16} color={colors.accent.error} />
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Output area */}
          {(translatedText !== '' || isTranslating) && (
            <View style={styles.outputCard}>
              <View style={styles.outputHeader}>
                <Text style={styles.outputLabel}>
                  {dstLang.flag} {dstLang.nativeName}
                </Text>
                <View style={styles.outputActions}>
                  {isTranslating && (
                    <ActivityIndicator size="small" color={colors.accent.primary} />
                  )}
                  {translatedText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => handlePlayTTS(translatedText, dstLang.code)}
                      style={styles.ttsButton}
                    >
                      <Feather name="volume-2" size={22} color={colors.accent.primaryLight} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.translatedText} selectable>
                {translatedText}
              </Text>

              {/* Intermediate text for pivot translations */}
              {intermediateText !== undefined && route?.requiresPivot && (
                <View style={styles.intermediateBox}>
                  <Text style={styles.intermediateLabel}>
                    🇬🇧 Paso intermedio (inglés):
                  </Text>
                  <Text style={styles.intermediateText}>{intermediateText}</Text>
                </View>
              )}

              {totalMs > 0 && (
                <View style={styles.outputFooter}>
                  <Text style={styles.latencyText}>
                    ⚡ {totalMs}ms
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.accent.primary,
    fontFamily: typography.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  langSelectorWrapper: {
    flex: 1,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.language.swap + '15',
    borderWidth: 1,
    borderColor: colors.language.swap + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  swapIcon: {
    fontSize: 20,
    color: colors.language.swap,
  },
  inputCard: {
    ...glassStyles.card,
    padding: spacing.base,
    marginTop: spacing.md,
    minHeight: 140,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  textInput: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    minHeight: 80,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
  },
  clearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    fontSize: typography.sizes.xs,
    color: colors.accent.error,
    fontFamily: typography.fonts.medium,
  },
  outputCard: {
    backgroundColor: colors.accent.primary + '08',
    borderWidth: 1,
    borderColor: colors.accent.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginTop: spacing.md,
    minHeight: 100,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  outputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.accent.primaryLight,
    fontFamily: typography.fonts.medium,
  },
  outputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ttsButton: {
    padding: spacing.xs,
  },
  ttsIcon: {
    fontSize: 20,
  },
  translatedText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  intermediateBox: {
    backgroundColor: colors.language.pivot + '08',
    borderWidth: 1,
    borderColor: colors.language.pivot + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  intermediateLabel: {
    fontSize: typography.sizes.xs,
    color: colors.language.pivot,
    fontFamily: typography.fonts.medium,
    marginBottom: spacing.xs,
  },
  intermediateText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    fontStyle: 'italic',
  },
  outputFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.accent.primary + '15',
  },
  latencyText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.medium,
  },
});

export default TextModeScreen;
