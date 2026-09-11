/**
 * ConversationModeScreen — Split-screen bidirectional conversation
 *
 * Features:
 * - Split screen with two halves (top rotated 180° for opposite speaker)
 * - Two fixed languages
 * - Push-to-talk per side or auto-VAD
 * - ASR → NMT (with pivot) → TTS pipeline
 * - Chat bubbles on both sides for visual verification
 * - Pause/edit button before TTS playback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, glassStyles } from '../theme/theme';
import { LanguageSelector } from '../components/LanguageSelector';
import { WaveformIndicator } from '../components/WaveformIndicator';
import { useEngine } from '../engine/TranslationEngineProvider';
import { LANGUAGE_MAP, type Language } from '../engine/model-constants';

interface ConversationMessage {
  id: string;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText: string;
  language: string;
  timestamp: number;
  pivotRoute?: string;
}

export function ConversationModeScreen() {
  const engine = useEngine();
  const [langA, setLangA] = useState<Language>(LANGUAGE_MAP['es']);
  const [langB, setLangB] = useState<Language>(LANGUAGE_MAP['fr']);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const scrollRefA = useRef<ScrollView>(null);
  const scrollRefB = useRef<ScrollView>(null);
  const micScaleA = useRef(new Animated.Value(1)).current;
  const micScaleB = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (langA.code !== langB.code) {
      engine.preloadModels(langA.code, langB.code);
    }
  }, [langA.code, langB.code, engine]);

  const handleStartConversation = useCallback(() => {
    setIsStarted(true);
    setMessages([]);
  }, []);

  const handleSpeakStart = useCallback((speaker: 'A' | 'B') => {
    setActiveSpeaker(speaker);
    const scaleAnim = speaker === 'A' ? micScaleA : micScaleB;
    Animated.spring(scaleAnim, {
      toValue: 1.15,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();
  }, []);

  const handleSpeakEnd = useCallback(async (speaker: 'A' | 'B') => {
    const scaleAnim = speaker === 'A' ? micScaleA : micScaleB;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();

    setActiveSpeaker(null);
    setIsProcessing(true);

    const srcLang = speaker === 'A' ? langA : langB;
    const dstLang = speaker === 'A' ? langB : langA;

    try {
      // Step 1: ASR
      const asrResult = await engine.transcribeAudio('mock://audio');

      // Step 2: NMT
      const route = engine.getRoute(srcLang.code, dstLang.code);
      const nmtResult = await engine.translateText(
        asrResult.text,
        srcLang.code,
        dstLang.code,
      );

      // Step 3: Add message
      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        speaker,
        originalText: asrResult.text,
        translatedText: nmtResult.translatedText,
        language: srcLang.code,
        timestamp: Date.now(),
        pivotRoute: route.requiresPivot ? route.routeLabel : undefined,
      };

      setMessages(prev => [...prev, newMessage]);

      // Step 4: TTS (play on the other side)
      await engine.synthesizeSpeech(nmtResult.translatedText, dstLang.code);
    } catch (err) {
      console.error('[Conversation] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [langA, langB, engine]);

  if (!isStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Modo Conversación</Text>
          <Text style={styles.setupSubtitle}>
            Selecciona los idiomas de cada persona
          </Text>

          <View style={styles.setupLanguages}>
            <View style={styles.personSetup}>
              <View style={styles.personIcon}>
                <Feather name="user" size={24} color={colors.accent.primary} />
              </View>
              <Text style={styles.personLabel}>Persona A</Text>
              <LanguageSelector
                selectedCode={langA.code}
                onSelect={setLangA}
                excludeCode={langB.code}
                accentColor={colors.language.source}
              />
            </View>

            <View style={styles.vsContainer}>
              <Feather name="refresh-cw" size={20} color={colors.text.tertiary} />
            </View>

            <View style={styles.personSetup}>
              <View style={[styles.personIcon, { backgroundColor: colors.accent.secondary + '15' }]}>
                <Feather name="user" size={24} color={colors.accent.secondary} />
              </View>
              <Text style={styles.personLabel}>Persona B</Text>
              <LanguageSelector
                selectedCode={langB.code}
                onSelect={setLangB}
                excludeCode={langA.code}
                accentColor={colors.language.target}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
            onPress={handleStartConversation}
            activeOpacity={0.8}
          >
            <Feather name="mic" size={18} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Iniciar conversación</Text>
          </TouchableOpacity>

          <Text style={styles.setupHint}>
            Coloca el teléfono entre ambas personas.{'\n'}
            Cada persona pulsa su botón para hablar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Active conversation - split screen
  return (
    <View style={styles.container}>
      {/* Side B (rotated 180° — for the person across the table) */}
      <View style={styles.speakerSideB}>
        <View style={styles.rotatedContent}>
          {/* B's chat bubbles */}
          <ScrollView
            ref={scrollRefB}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRefB.current?.scrollToEnd()}
          >
            {messages.map(msg => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.speaker === 'B' ? styles.bubbleOwn : styles.bubbleOther,
                ]}
              >
                <Text style={styles.bubbleText}>
                  {msg.speaker === 'B' ? msg.originalText : msg.translatedText}
                </Text>
                {msg.pivotRoute && (
                  <Text style={styles.pivotLabel}>⟳ {msg.pivotRoute}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          {/* B's mic button */}
          <Animated.View style={{ transform: [{ scale: micScaleB }] }}>
            <Pressable
              onPressIn={() => handleSpeakStart('B')}
              onPressOut={() => handleSpeakEnd('B')}
              disabled={isProcessing || activeSpeaker === 'A'}
              style={[
                styles.speakerMic,
                { backgroundColor: colors.accent.secondary },
                (isProcessing || activeSpeaker === 'A') && styles.micDisabled,
              ]}
            >
              <Feather 
                name={activeSpeaker === 'B' ? 'square' : 'mic'} 
                size={22} 
                color="#FFFFFF" 
              />
              {activeSpeaker === 'B' && (
                <WaveformIndicator isActive={true} color="#FFFFFF" barCount={3} height={20} />
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.speakerLabel}>
            <Text style={styles.speakerLabelText}>
              {langB.flag} {langB.nativeName}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => setIsStarted(false)}
        >
          <Feather name="x" size={20} color={colors.accent.error} />
        </TouchableOpacity>
        <View style={styles.dividerLine} />
      </View>

      {/* Side A (normal orientation) */}
      <View style={styles.speakerSideA}>
        {/* A's chat bubbles */}
        <ScrollView
          ref={scrollRefA}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRefA.current?.scrollToEnd()}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.speaker === 'A' ? styles.bubbleOwn : styles.bubbleOther,
              ]}
            >
              <Text style={styles.bubbleText}>
                {msg.speaker === 'A' ? msg.originalText : msg.translatedText}
              </Text>
              {msg.pivotRoute && (
                <Text style={styles.pivotLabel}>⟳ {msg.pivotRoute}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* A's mic button */}
        <Animated.View style={{ transform: [{ scale: micScaleA }] }}>
          <Pressable
            onPressIn={() => handleSpeakStart('A')}
            onPressOut={() => handleSpeakEnd('A')}
            disabled={isProcessing || activeSpeaker === 'B'}
            style={[
              styles.speakerMic,
              { backgroundColor: colors.accent.primary },
              (isProcessing || activeSpeaker === 'B') && styles.micDisabled,
            ]}
          >
            <Feather 
              name={activeSpeaker === 'A' ? 'square' : 'mic'} 
              size={22} 
              color="#FFFFFF" 
            />
            {activeSpeaker === 'A' && (
              <WaveformIndicator isActive={true} color="#FFFFFF" barCount={3} height={20} />
            )}
          </Pressable>
        </Animated.View>

        <View style={styles.speakerLabel}>
          <Text style={styles.speakerLabelText}>
            {langA.flag} {langA.nativeName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  // ── Setup screen ──
  setupContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: typography.sizes['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  setupLanguages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  personSetup: {
    flex: 1,
    gap: spacing.sm,
    alignItems: 'center',
  },
  personIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personEmoji: {
    fontSize: 28,
  },
  personLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  vsContainer: {
    paddingTop: spacing['3xl'],
  },
  vsText: {
    fontSize: 24,
    color: colors.text.tertiary,
  },
  startButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  startButtonText: {
    fontSize: typography.sizes.md,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  setupHint: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  // ── Active conversation ──
  speakerSideA: {
    flex: 1,
    padding: spacing.base,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  speakerSideB: {
    flex: 1,
    padding: spacing.base,
    transform: [{ rotate: '180deg' }],
  },
  rotatedContent: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  speakerLabel: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  speakerLabelText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  speakerMic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  speakerMicIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  micDisabled: {
    opacity: 0.3,
  },
  chatArea: {
    flexGrow: 1,
    flexShrink: 1,
  },
  chatContent: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent.primary + '20',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  pivotLabel: {
    fontSize: typography.sizes.xs,
    color: colors.language.pivot,
    fontFamily: typography.fonts.medium,
    marginTop: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  endButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.error + '20',
    borderWidth: 1,
    borderColor: colors.accent.error + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  endButtonText: {
    fontSize: 14,
    color: colors.accent.error,
    fontFamily: typography.fonts.bold,
  },
});

export default ConversationModeScreen;
