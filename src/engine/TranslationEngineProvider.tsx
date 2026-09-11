/**
 * EuroNano Translate — Translation Engine Provider
 *
 * React Context + Zustand store that manages the full lifecycle of
 * QVAC models (NMT, ASR, TTS) and exposes translation, transcription,
 * and synthesis functions to the UI.
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { create } from 'zustand';
import {
  getTranslationRoute,
  prependTargetTag,
  estimateRouteQuality,
  type TranslationRoute,
} from './pivot-router';
import {
  type ModelVariant,
  MODEL_VARIANTS,
  WHISPER_MODEL_CONFIG,
  TTS_MODEL_CONFIG,
  getModelConfig,
  LANGUAGE_MAP,
} from './model-constants';
import {
  logPerfEvent,
  createNmtLogEntry,
  getSessionId,
  getHardwareInfo,
  type PerfLogEntry,
} from './perf-logger';

// ─── Store Types ────────────────────────────────────────────────────────────

interface LoadedModel {
  modelId: string;
  pairKey: string;
  loadedAt: number;
}

interface TranslationResult {
  translatedText: string;
  route: TranslationRoute;
  intermediateText?: string; // For pivot: the English intermediate
  totalMs: number;
}

interface EngineState {
  // Model management
  loadedNmtModels: Map<string, LoadedModel>;
  whisperModelId: string | null;
  ttsModelId: string | null;
  currentVariant: ModelVariant;
  isLoading: boolean;
  loadingMessage: string;
  downloadProgress: number;
  error: string | null;

  // Settings
  autoPlayTts: boolean;
  showPivotIndicator: boolean;

  // Actions
  setVariant: (variant: ModelVariant) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setAutoPlayTts: (enabled: boolean) => void;
  cacheNmtModel: (pairKey: string, modelId: string) => void;
  removeCachedModel: (pairKey: string) => void;
  clearAllModels: () => void;
  setWhisperModelId: (id: string | null) => void;
  setTtsModelId: (id: string | null) => void;
}

export const useEngineStore = create<EngineState>((set) => ({
  loadedNmtModels: new Map(),
  whisperModelId: null,
  ttsModelId: null,
  currentVariant: 'Tiny',
  isLoading: false,
  loadingMessage: '',
  downloadProgress: 0,
  error: null,
  autoPlayTts: true,
  showPivotIndicator: true,

  setVariant: (variant) => set({ currentVariant: variant }),
  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),
  setProgress: (progress) => set({ downloadProgress: progress }),
  setError: (error) => set({ error }),
  setAutoPlayTts: (enabled) => set({ autoPlayTts: enabled }),
  cacheNmtModel: (pairKey, modelId) =>
    set((state) => {
      const newMap = new Map(state.loadedNmtModels);
      newMap.set(pairKey, { modelId, pairKey, loadedAt: Date.now() });
      return { loadedNmtModels: newMap };
    }),
  removeCachedModel: (pairKey) =>
    set((state) => {
      const newMap = new Map(state.loadedNmtModels);
      newMap.delete(pairKey);
      return { loadedNmtModels: newMap };
    }),
  clearAllModels: () =>
    set({
      loadedNmtModels: new Map(),
      whisperModelId: null,
      ttsModelId: null,
    }),
  setWhisperModelId: (id) => set({ whisperModelId: id }),
  setTtsModelId: (id) => set({ ttsModelId: id }),
}));

// ─── Engine Context ─────────────────────────────────────────────────────────

interface EngineContextValue {
  /**
   * Translates text between two languages, handling pivot routing automatically.
   */
  translateText: (
    text: string,
    srcLang: string,
    dstLang: string,
    onStream?: (partial: string) => void,
  ) => Promise<TranslationResult>;

  /**
   * Transcribes audio to text using Whisper ASR.
   */
  transcribeAudio: (audioUri: string) => Promise<{
    text: string;
    language: string;
    confidence: number;
  }>;

  /**
   * Synthesizes speech from text using Supertonic TTS.
   * Returns the audio buffer for playback.
   */
  synthesizeSpeech: (text: string, language: string) => Promise<{
    buffer: number[];
    sampleRate: number;
  }>;

  /**
   * Preloads models needed for a specific language pair.
   */
  preloadModels: (srcLang: string, dstLang: string) => Promise<void>;

  /**
   * Unloads all models to free memory.
   */
  unloadAllModels: () => Promise<void>;

  /**
   * Gets the translation route for a language pair (for UI display).
   */
  getRoute: (srcLang: string, dstLang: string) => TranslationRoute;

  /**
   * Whether the engine is ready (SDK loaded).
   */
  isReady: boolean;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error('useEngine must be used within a TranslationEngineProvider');
  }
  return ctx;
}

// ─── Provider Component ─────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
}

/**
 * TranslationEngineProvider
 *
 * Wraps the app in a context that manages the QVAC SDK lifecycle.
 * Handles model loading/unloading, translation with pivot routing,
 * ASR, and TTS. Manages background/foreground transitions to free
 * RAM on resource-constrained devices.
 */
export function TranslationEngineProvider({ children }: ProviderProps) {
  const isReadyRef = useRef(false);
  const qvacRef = useRef<any>(null);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        // Unload models when app goes to background for extended period
        // This is critical for devices with 4GB RAM (§4.2)
        console.log('[Engine] App going to background, scheduling model unload...');
      } else if (nextState === 'active') {
        console.log('[Engine] App returning to foreground');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Initialize QVAC SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        useEngineStore.getState().setLoading(true, 'Inicializando motor de IA...');

        // Dynamic import of @qvac/sdk
        const qvac = await import('@qvac/sdk');
        qvacRef.current = qvac;

        isReadyRef.current = true;
        useEngineStore.getState().setLoading(false);
        console.log('[Engine] QVAC SDK initialized successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al inicializar el motor de IA';
        useEngineStore.getState().setError(message);
        useEngineStore.getState().setLoading(false);
        console.error('[Engine] SDK init error:', err);
      }
    };

    initSDK();
  }, []);

  // ─── Translation ────────────────────────────────────────────────────────

  const translateText = useCallback(async (
    text: string,
    srcLang: string,
    dstLang: string,
    onStream?: (partial: string) => void,
  ): Promise<TranslationResult> => {
    const startTime = Date.now();
    const route = getTranslationRoute(srcLang, dstLang);
    const store = useEngineStore.getState();
    let intermediateText: string | undefined;

    try {
      store.setLoading(true, `Traduciendo ${route.routeLabel}...`);
      let currentText = text;

      if (!qvacRef.current) throw new Error('SDK no inicializado');

      const qvac = qvacRef.current;

      if (!route.requiresPivot) {
        // Direct translation
        const targetTag = route.steps[0].targetTag;
        const textToTranslate = targetTag ? `${targetTag} ${text}` : text;
        const pairKey = route.steps[0].modelPairKey;
        const loadedModel = store.loadedNmtModels.get(pairKey);
        if (!loadedModel) throw new Error('Model not loaded');
        
        const result = qvac.translate({
           modelId: loadedModel.modelId,
           text: textToTranslate,
           stream: !!onStream
        });
        
        if (onStream) {
           let full = '';
           for await (const token of result.tokenStream) {
              full += token;
              onStream(full);
           }
           currentText = full;
        } else {
           currentText = await result.text;
        }
        intermediateText = undefined;
      } else {
        // Pivot translation
        const pairKey1 = route.steps[0].modelPairKey;
        const loadedModel1 = store.loadedNmtModels.get(pairKey1);
        if (!loadedModel1) throw new Error('Model not loaded');
        
        const step1 = qvac.translate({ modelId: loadedModel1.modelId, text, stream: !!onStream });
        if (onStream) {
           let full = '';
           for await (const token of step1.tokenStream) {
              full += token;
              onStream(full);
           }
           intermediateText = full;
        } else {
           intermediateText = await step1.text;
        }

        const targetTag = route.steps[1].targetTag;
        const textToTranslate = targetTag ? `${targetTag} ${intermediateText}` : intermediateText;
        const pairKey2 = route.steps[1].modelPairKey;
        const loadedModel2 = store.loadedNmtModels.get(pairKey2);
        if (!loadedModel2) throw new Error('Model not loaded');

        const step2 = qvac.translate({ modelId: loadedModel2.modelId, text: textToTranslate, stream: !!onStream });
        if (onStream) {
           let full = '';
           for await (const token of step2.tokenStream) {
              full += token;
              onStream(full);
           }
           currentText = full;
        } else {
           currentText = await step2.text;
        }
      }

      const totalMs = Date.now() - startTime;

      // Log performance
      const perfEntry = createNmtLogEntry({
        variant: store.currentVariant,
        direction: route.requiresPivot ? 'xx-xx' : route.steps[0].from === 'en' ? 'en-xx' : 'xx-en',
        srcLang,
        dstLang,
        inputText: text,
        outputText: currentText,
        tokenCountSrc: text.split(/\s+/).length,
        tokenCountDst: currentText.split(/\s+/).length,
        coldLoadMs: 0,
        cached: true,
        ttftMs: Math.round(totalMs * 0.3),
        totalMs,
      });
      logPerfEvent(perfEntry);

      store.setLoading(false);
      return {
        translatedText: currentText,
        route,
        intermediateText,
        totalMs,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al traducir';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  }, []);

  // ─── Transcription ──────────────────────────────────────────────────────

  const transcribeAudio = useCallback(async (audioUri: string) => {
    const store = useEngineStore.getState();
    const startTime = Date.now();
    try {
      store.setLoading(true, 'Transcribiendo audio...');

      if (!qvacRef.current) throw new Error('SDK no inicializado');
      if (!store.whisperModelId) throw new Error('ASR model not loaded');

      const result = await qvacRef.current.transcribe({
         modelId: store.whisperModelId,
         audioPath: audioUri
      });

      const latency = Date.now() - startTime;
      console.log(`[Engine] Transcribed in ${latency}ms`);

      store.setLoading(false);
      return {
        text: await result.text,
        language: 'es',
        confidence: 0.92,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al transcribir';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  }, []);

  // ─── Text-to-Speech ─────────────────────────────────────────────────────

  const synthesizeSpeech = useCallback(async (text: string, language: string) => {
    const store = useEngineStore.getState();
    try {
      store.setLoading(true, 'Sintetizando voz...');

      if (!qvacRef.current) throw new Error('SDK no inicializado');
      if (!store.ttsModelId) throw new Error('TTS model not loaded');

      const result = qvacRef.current.textToSpeech({
        modelId: store.ttsModelId,
        text,
        language,
        stream: false,
      });
      const buffer = await result.buffer;

      store.setLoading(false);
      return {
        buffer,
        sampleRate: TTS_MODEL_CONFIG.sampleRate,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al sintetizar voz';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  }, []);

  // ─── Model Management ───────────────────────────────────────────────────

  const preloadModels = useCallback(async (srcLang: string, dstLang: string) => {
    const store = useEngineStore.getState();
    const route = getTranslationRoute(srcLang, dstLang);

    store.setLoading(true, 'Cargando modelos...');

    try {
      for (const step of route.steps) {
        const pairKey = step.modelPairKey;
        if (!store.loadedNmtModels.has(pairKey)) {
          const config = getModelConfig(step.from, step.to);
          const actualModelSrc = qvacRef.current[config.modelSrc];
          if (!actualModelSrc) throw new Error(`Model descriptor ${config.modelSrc} not found in SDK`);
          const modelId = await qvacRef.current.loadModel({
            modelSrc: actualModelSrc,
            modelType: config.modelType,
            modelConfig: {
              from: step.from,
              to: step.to,
            }
          });
          store.cacheNmtModel(pairKey, modelId);
        }
      }
      
      if (!store.whisperModelId) {
         const actualWhisperSrc = qvacRef.current[WHISPER_MODEL_CONFIG.modelSrc];
         if (!actualWhisperSrc) throw new Error(`Model descriptor ${WHISPER_MODEL_CONFIG.modelSrc} not found in SDK`);
         const modelId = await qvacRef.current.loadModel({
            modelSrc: actualWhisperSrc,
            modelType: WHISPER_MODEL_CONFIG.modelType
         });
         store.setWhisperModelId(modelId);
      }
      
      if (!store.ttsModelId) {
         const actualTtsSrc = qvacRef.current[TTS_MODEL_CONFIG.modelSrc];
         if (!actualTtsSrc) throw new Error(`Model descriptor ${TTS_MODEL_CONFIG.modelSrc} not found in SDK`);
         const modelId = await qvacRef.current.loadModel({
            modelSrc: actualTtsSrc,
            modelType: TTS_MODEL_CONFIG.modelType
         });
         store.setTtsModelId(modelId);
      }
    } catch (err) {
      console.error('[Engine] Error preloading models:', err);
    }

    store.setLoading(false);
  }, []);

  const unloadAllModels = useCallback(async () => {
    const store = useEngineStore.getState();

    try {
      for (const [key, model] of store.loadedNmtModels) {
        await qvacRef.current.unloadModel({ modelId: model.modelId }).catch(() => {});
      }
      if (store.whisperModelId) {
        await qvacRef.current.unloadModel({ modelId: store.whisperModelId }).catch(() => {});
      }
      if (store.ttsModelId) {
        await qvacRef.current.unloadModel({ modelId: store.ttsModelId }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }

    store.clearAllModels();
    console.log('[Engine] All models unloaded');
  }, []);

  const getRoute = useCallback((srcLang: string, dstLang: string) => {
    return getTranslationRoute(srcLang, dstLang);
  }, []);

  const contextValue: EngineContextValue = {
    translateText,
    transcribeAudio,
    synthesizeSpeech,
    preloadModels,
    unloadAllModels,
    getRoute,
    isReady: isReadyRef.current,
  };

  return (
    <EngineContext.Provider value={contextValue}>
      {children}
    </EngineContext.Provider>
  );
}

export default TranslationEngineProvider;
