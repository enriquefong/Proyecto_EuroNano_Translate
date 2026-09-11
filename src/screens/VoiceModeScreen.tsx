/**
 * VoiceModeScreen — Push-to-talk voice translation
 *
 * Features:
 * - Push-to-talk microphone button
 * - ASR transcription with editable text
 * - Translation with streaming
 * - TTS playback of result
 * - Confidence indicator
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
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { AudioStudioModule, useAudioRecorder } from '@siteed/audio-studio';
import { Feather } from '@expo/vector-icons';
import { toByteArray } from 'base64-js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, glassStyles } from '../theme/theme';
import { LanguageSelector } from '../components/LanguageSelector';
import { PivotIndicator } from '../components/PivotIndicator';
import { WaveformIndicator } from '../components/WaveformIndicator';
import { ModelStatusBadge } from '../components/ModelStatusBadge';
import { useEngine } from '../engine/TranslationEngineProvider';
import { LANGUAGE_MAP, type Language } from '../engine/model-constants';

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'reviewing' | 'translating' | 'playing';

export function VoiceModeScreen() {
  const engine = useEngine();
  const player = useAudioPlayer(null as any);
  const { startRecording, stopRecording } = useAudioRecorder();
  const [srcLang, setSrcLang] = useState<Language>(LANGUAGE_MAP['es']);
  const [dstLang, setDstLang] = useState<Language>(LANGUAGE_MAP['en']);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (srcLang.code !== dstLang.code) {
      engine.preloadModels(srcLang.code, dstLang.code);
    }
  }, [srcLang.code, dstLang.code, engine]);

  // Microphone press handlers
  const handleMicPressIn = useCallback(async () => {
    try {
      await AudioStudioModule.requestPermissionsAsync();
    } catch (e) { /* already granted */ }
    setVoiceState('recording');
    Animated.spring(micScaleAnim, {
      toValue: 1.15,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();

    try {
      await startRecording, stopRecording.record();
    } catch (err) {
      console.error('[VoiceMode] startRecording, stopRecording.record() error:', err);
      setVoiceState('idle');
    }
  }, [startRecording, stopRecording, micScaleAnim, pulseAnim]);

  const handleMicPressOut = useCallback(async () => {
    Animated.spring(micScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
    pulseAnim.setValue(1);

    // Transcribe
    setVoiceState('transcribing');
    try {
      const stopResult = await stopRecording();
      const audioUri = stopResult.fileUri;
      if (!audioUri) throw new Error('No recording URI');
      const result = await engine.transcribeAudio(audioUri);
      setTranscribedText(result.text);
      setConfidence(result.confidence);
      setVoiceState('reviewing');
    } catch (err) {
      console.error('[VoiceMode] ASR error:', err);
      setVoiceState('idle');
    }
  }, [engine, startRecording, stopRecording]);

  // Translate transcribed text
  const handleTranslate = useCallback(async () => {
    if (!transcribedText.trim()) return;

    setVoiceState('translating');
    try {
      const result = await engine.translateText(
        transcribedText,
        srcLang.code,
        dstLang.code,
      );
      setTranslatedText(result.translatedText);
      setVoiceState('playing');

      // Auto-play TTS
      const ttsResult = await engine.synthesizeSpeech(result.translatedText, dstLang.code);
      if (ttsResult && ttsResult.uri) {
        player.replace(ttsResult.uri);
        player.play();
      }
      setVoiceState('idle');
    } catch (err) {
      console.error('[VoiceMode] Translation error:', err);
      setVoiceState('idle');
    }
  }, [transcribedText, srcLang.code, dstLang.code, engine]);

  // Reset
  const handleReset = useCallback(() => {
    setVoiceState('idle');
    setTranscribedText('');
    setTranslatedText('');
    setConfidence(0);
    setIsEditing(false);
  }, []);

  const route = srcLang.code !== dstLang.code
    ? engine.getRoute(srcLang.code, dstLang.code)
    : null;

  const getStateLabel = (): string => {
    switch (voiceState) {
      case 'idle': return 'Mantén pulsado para hablar';
      case 'recording': return 'Grabando... suelta para traducir';
      case 'transcribing': return 'Transcribiendo...';
      case 'reviewing': return 'Revisa y confirma el texto';
      case 'translating': return 'Traduciendo...';
      case 'playing': return 'Reproduciendo traducción...';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Traducir</Text>
          <Text style={styles.subtitle}>Voz</Text>
        </View>

        <ModelStatusBadge />

        {/* Language selectors */}
        <View style={styles.languageRow}>
          <View style={styles.langSelectorWrapper}>
            <LanguageSelector
              selectedCode={srcLang.code}
              onSelect={setSrcLang}
              label="HABLA EN"
              excludeCode={dstLang.code}
              accentColor={colors.language.source}
            />
          </View>
          <Feather name="arrow-right" size={24} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
          <View style={styles.langSelectorWrapper}>
            <LanguageSelector
              selectedCode={dstLang.code}
              onSelect={setDstLang}
              label="TRADUCE A"
              excludeCode={srcLang.code}
              accentColor={colors.language.target}
            />
          </View>
        </View>

        <PivotIndicator route={route} isTranslating={voiceState === 'translating'} />

        {/* Microphone button */}
        <View style={styles.micSection}>
          <Animated.View style={[
            styles.micPulse,
            {
              transform: [{ scale: voiceState === 'recording' ? pulseAnim : 1 }],
              opacity: voiceState === 'recording' ? 0.3 : 0,
            },
          ]} />

          <Animated.View style={{ transform: [{ scale: micScaleAnim }] }}>
            <Pressable
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              disabled={voiceState !== 'idle' && voiceState !== 'recording'}
              style={[
                styles.micButton,
                voiceState === 'recording' && styles.micButtonRecording,
                (voiceState !== 'idle' && voiceState !== 'recording') && styles.micButtonDisabled,
              ]}
            >
              <Feather 
                name={voiceState === 'recording' ? 'square' : 'mic'} 
                size={32} 
                color="#FFFFFF" 
              />
            </Pressable>
          </Animated.View>

          {voiceState === 'recording' && (
            <WaveformIndicator isActive={true} color={colors.accent.error} />
          )}

          <Text style={styles.stateLabel}>{getStateLabel()}</Text>
        </View>

        {/* Transcription result */}
        {(voiceState === 'reviewing' || transcribedText !== '') && (
          <View style={styles.transcriptionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>
                {srcLang.flag} Texto reconocido
              </Text>
              {confidence > 0 && (
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: confidence > 0.8 ? colors.accent.success + '15' : colors.accent.warning + '15' },
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: confidence > 0.8 ? colors.accent.success : colors.accent.warning },
                  ]}>
                    {Math.round(confidence * 100)}% conf.
                  </Text>
                </View>
              )}
            </View>

            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={transcribedText}
                onChangeText={setTranscribedText}
                multiline
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.transcribedText}>{transcribedText}</Text>
                <Text style={styles.editHint}>Toca para editar</Text>
              </TouchableOpacity>
            )}

            {voiceState === 'reviewing' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.translateButton} onPress={handleTranslate}>
                  <Text style={styles.translateButtonText}>Traducir →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Translation result */}
        {translatedText !== '' && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: colors.accent.primaryLight }]}>
                {dstLang.flag} Traducción
              </Text>
              <TouchableOpacity
                onPress={async () => {
                const res = await engine.synthesizeSpeech(translatedText, dstLang.code);
                if (res.uri) {
                  player.replace(res.uri);
                  player.play();
                }
              }}
                style={styles.ttsButton}
              >
                <Feather name="volume-2" size={22} color={colors.accent.primaryLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.resultText} selectable>{translatedText}</Text>

            <TouchableOpacity style={[styles.newTranslation, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={handleReset}>
              <Feather name="mic" size={18} color={colors.accent.primary} />
              <Text style={styles.newTranslationText}>Nueva traducción</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading states */}
        {(voiceState === 'transcribing' || voiceState === 'translating') && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
            <Text style={styles.loadingText}>
              {voiceState === 'transcribing' ? 'Transcribiendo audio...' : 'Traduciendo...'}
            </Text>
          </View>
        )}
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
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.accent.secondary,
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
  },
  langSelectorWrapper: { flex: 1 },
  arrowText: {
    fontSize: 20,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  micSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.base,
  },
  micPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.error,
    top: spacing.xl,
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  micButtonRecording: {
    backgroundColor: colors.accent.error,
  },
  micButtonDisabled: {
    backgroundColor: colors.bg.elevated,
    opacity: 0.5,
  },
  micIcon: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  stateLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  transcriptionCard: {
    ...glassStyles.card,
    padding: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  confidenceBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  confidenceText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
  },
  transcribedText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  editInput: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    borderWidth: 1,
    borderColor: colors.border.active,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    minHeight: 60,
  },
  editHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  translateButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  translateButtonText: {
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  resultCard: {
    backgroundColor: colors.accent.primary + '08',
    borderWidth: 1,
    borderColor: colors.accent.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  ttsButton: { padding: spacing.xs },
  ttsIcon: { fontSize: 20 },
  resultText: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  newTranslation: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.accent.primary + '15',
  },
  newTranslationText: {
    fontSize: typography.sizes.base,
    color: colors.accent.primary,
    fontFamily: typography.fonts.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.base,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
});

export default VoiceModeScreen;
