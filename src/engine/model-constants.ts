/**
 * EuroNano Translate — Model Constants
 *
 * Maps supported languages to their QVAC SDK model constants and
 * configuration for Bergamot NMT, Whisper ASR, and Supertonic TTS.
 *
 * Model: qvac/TranslatePsy-EuroNano
 * Architecture: Marian/Bergamot (encoder Transformer 6-layer, decoder SSRU)
 * Variants: Tiny (16.9M, 17MB INT8), BaseMemory (31.25M, 31MB), Base (42.68M, 42MB)
 */

// ─── Supported Languages ────────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** Target-language tag prefix for en→xx direction (e.g. "##DE") */
  targetTag: string;
  /** COMET quality score for xx→en */
  cometXxEn: number;
  /** COMET quality score for en→xx */
  cometEnXx: number;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇬🇧', targetTag: '',     cometXxEn: 1.0,   cometEnXx: 1.0   },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪', targetTag: '##DE', cometXxEn: 0.872, cometEnXx: 0.838 },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸', targetTag: '##ES', cometXxEn: 0.878, cometEnXx: 0.842 },
  { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷', targetTag: '##FR', cometXxEn: 0.870, cometEnXx: 0.835 },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',   flag: '🇮🇹', targetTag: '##IT', cometXxEn: 0.865, cometEnXx: 0.830 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  flag: '🇵🇹', targetTag: '##PT', cometXxEn: 0.862, cometEnXx: 0.828 },
  { code: 'fi', name: 'Finnish',    nativeName: 'Suomi',      flag: '🇫🇮', targetTag: '##FI', cometXxEn: 0.840, cometEnXx: 0.800 },
  { code: 'cs', name: 'Czech',      nativeName: 'Čeština',    flag: '🇨🇿', targetTag: '##CS', cometXxEn: 0.845, cometEnXx: 0.810 },
  { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands', flag: '🇳🇱', targetTag: '##NL', cometXxEn: 0.858, cometEnXx: 0.825 },
  { code: 'sv', name: 'Swedish',    nativeName: 'Svenska',    flag: '🇸🇪', targetTag: '##SV', cometXxEn: 0.855, cometEnXx: 0.820 },
];

export const LANGUAGE_MAP = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(lang => [lang.code, lang])
);

// ─── Model Variant Configuration ────────────────────────────────────────────

export type ModelVariant = 'Tiny' | 'BaseMemory' | 'Base';

export interface ModelVariantInfo {
  name: ModelVariant;
  params: string;
  sizeInt8: string;
  description: string;
  recommended: boolean;
  /** Approximate sentences/sec on mid-range Android CPU */
  androidThroughput: number;
}

export const MODEL_VARIANTS: ModelVariantInfo[] = [
  {
    name: 'Tiny',
    params: '16.9M',
    sizeInt8: '17 MB',
    description: 'Más rápido, ideal para gama media. Calidad: 94% de Firefox Translations.',
    recommended: true,
    androidThroughput: 4.12,
  },
  {
    name: 'BaseMemory',
    params: '31.25M',
    sizeInt8: '31 MB',
    description: 'Balance entre velocidad y calidad. Buena opción para gama media-alta.',
    recommended: false,
    androidThroughput: 2.8,
  },
  {
    name: 'Base',
    params: '42.68M',
    sizeInt8: '42 MB',
    description: 'Mejor calidad, más lento. Recomendado solo para gama alta.',
    recommended: false,
    androidThroughput: 1.9,
  },
];

// ─── QVAC Model Source Identifiers ──────────────────────────────────────────

/**
 * Bergamot NMT model sources from the QVAC model registry.
 *
 * The model names follow the QVAC convention: BERGAMOT_{FROM}_{TO}
 * These constants are imported from @qvac/sdk when available,
 * or loaded by HTTP URL / filesystem path.
 *
 * TranslatePsy-EuroNano provides two direction groups:
 *   - en→xx: English to any of the 9 European languages
 *   - xx→en: Any of the 9 European languages to English
 */

export interface TranslationModelConfig {
  from: string;
  to: string;
  /** QVAC SDK model constant name or HuggingFace URL */
  modelSrc: string;
  engine: 'Bergamot';
  modelType: 'nmtcpp-translation';
}

/**
 * Maps a language pair key (e.g. "en-es", "es-en") to its model config.
 * For xx→xx pairs, the pivot router handles the two-hop translation.
 */
export function getModelConfig(from: string, to: string): TranslationModelConfig {
  return {
    from,
    to,
    modelSrc: `BERGAMOT_${from.toUpperCase()}_${to.toUpperCase()}`,
    engine: 'Bergamot',
    modelType: 'nmtcpp-translation',
  };
}

/**
 * Generates all direct model pair keys.
 * Direct pairs are: en↔{de,es,fr,it,pt,fi,cs,nl,sv}
 */
export function getDirectPairs(): string[] {
  const nonEnglish = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');
  const pairs: string[] = [];
  for (const lang of nonEnglish) {
    pairs.push(`en-${lang.code}`);
    pairs.push(`${lang.code}-en`);
  }
  return pairs;
}

// ─── Whisper ASR Configuration ──────────────────────────────────────────────

export const WHISPER_MODEL_CONFIG = {
  /** Model source for Whisper tiny multilingual */
  modelSrc: 'WHISPER_TINY_MULTILINGUAL',
  modelType: 'whisper' as const,
  /** Supported languages for ASR (subset of our translation languages) */
  supportedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'fi', 'cs', 'nl', 'sv'],
};

// ─── TTS Configuration ──────────────────────────────────────────────────────

export const TTS_MODEL_CONFIG = {
  /** Supertonic multilingual TTS model */
  modelSrc: 'TTS_MULTILINGUAL_SUPERTONIC2_Q8_0',
  modelType: 'tts' as const,
  ttsEngine: 'supertonic' as const,
  /** Default voice */
  voice: 'F1',
  /** Output sample rate for Supertonic */
  sampleRate: 44100,
  /** Language to voice mapping */
  languageVoices: {
    en: 'F1',
    de: 'F1',
    es: 'F1',
    fr: 'F1',
    it: 'F1',
    pt: 'F1',
    fi: 'F1',
    cs: 'F1',
    nl: 'F1',
    sv: 'F1',
  } as Record<string, string>,
};
