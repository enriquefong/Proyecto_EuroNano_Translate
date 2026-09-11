/**
 * EuroNano Translate — Pivot Router
 *
 * Determines whether a translation needs a direct path or an English pivot.
 *
 * Rules from the TranslatePsy-EuroNano model card:
 *   - en→xx: Direct translation. Prepend target tag (e.g. ##DE, ##ES).
 *   - xx→en: Direct translation. No tag needed.
 *   - xx→yy: NOT directly supported. Must pivot through English:
 *             xx→en (step 1) then en→yy (step 2).
 */

import { LANGUAGE_MAP, type Language } from './model-constants';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TranslationStep {
  /** Source language code */
  from: string;
  /** Target language code */
  to: string;
  /** Target tag to prepend for en→xx direction, empty for xx→en */
  targetTag: string;
  /** Model pair key for loading the correct model */
  modelPairKey: string;
}

export interface TranslationRoute {
  /** Ordered steps to execute */
  steps: TranslationStep[];
  /** Whether the route requires an English pivot */
  requiresPivot: boolean;
  /** Human-readable description of the route (e.g. "es → en → fr") */
  routeLabel: string;
  /** Source language info */
  srcLang: Language;
  /** Destination language info */
  dstLang: Language;
  /** Intermediate language info (if pivot) */
  pivotLang?: Language;
}

// ─── Router ─────────────────────────────────────────────────────────────────

/**
 * Computes the translation route between two languages.
 *
 * @param srcCode - Source language code (e.g. "es")
 * @param dstCode - Target language code (e.g. "fr")
 * @returns TranslationRoute with steps and metadata
 * @throws Error if either language is not supported
 */
export function getTranslationRoute(srcCode: string, dstCode: string): TranslationRoute {
  const srcLang = LANGUAGE_MAP[srcCode];
  const dstLang = LANGUAGE_MAP[dstCode];

  if (!srcLang) throw new Error(`Idioma origen no soportado: ${srcCode}`);
  if (!dstLang) throw new Error(`Idioma destino no soportado: ${dstCode}`);
  if (srcCode === dstCode) throw new Error('Los idiomas de origen y destino deben ser diferentes');

  const isSourceEnglish = srcCode === 'en';
  const isTargetEnglish = dstCode === 'en';

  // Case 1: en → xx (direct, with target tag)
  if (isSourceEnglish) {
    return {
      steps: [{
        from: 'en',
        to: dstCode,
        targetTag: dstLang.targetTag,
        modelPairKey: `en-${dstCode}`,
      }],
      requiresPivot: false,
      routeLabel: `en → ${dstCode}`,
      srcLang,
      dstLang,
    };
  }

  // Case 2: xx → en (direct, no tag)
  if (isTargetEnglish) {
    return {
      steps: [{
        from: srcCode,
        to: 'en',
        targetTag: '',
        modelPairKey: `${srcCode}-en`,
      }],
      requiresPivot: false,
      routeLabel: `${srcCode} → en`,
      srcLang,
      dstLang,
    };
  }

  // Case 3: xx → yy (pivot through English)
  const pivotLang = LANGUAGE_MAP['en'];
  return {
    steps: [
      {
        from: srcCode,
        to: 'en',
        targetTag: '',
        modelPairKey: `${srcCode}-en`,
      },
      {
        from: 'en',
        to: dstCode,
        targetTag: dstLang.targetTag,
        modelPairKey: `en-${dstCode}`,
      },
    ],
    requiresPivot: true,
    routeLabel: `${srcCode} → en → ${dstCode}`,
    srcLang,
    dstLang,
    pivotLang,
  };
}

/**
 * Prepends the target language tag to input text for en→xx translations.
 *
 * From the model card: "Control de idioma destino: Prefijo de tag en el texto
 * fuente para en→xx (##DE, ##FR, ##ES…); no se necesita tag en xx→en"
 *
 * @param text - The source text to translate
 * @param targetTag - The tag to prepend (e.g. "##DE"), or empty string
 * @returns Text with prepended tag, or original text if no tag needed
 */
export function prependTargetTag(text: string, targetTag: string): string {
  if (!targetTag) return text;
  return `${targetTag} ${text}`;
}

/**
 * Estimates quality for a translation route based on COMET scores.
 *
 * For pivoted translations (xx→en→yy), the quality is approximately
 * the product of both legs' COMET scores (compounded error).
 *
 * @returns A quality score between 0 and 1
 */
export function estimateRouteQuality(route: TranslationRoute): number {
  if (!route.requiresPivot) {
    // Direct route: use the COMET score for this direction
    const step = route.steps[0];
    if (step.from === 'en') {
      return route.dstLang.cometEnXx;
    }
    return route.srcLang.cometXxEn;
  }

  // Pivoted route: compound the quality of both legs
  const leg1Quality = route.srcLang.cometXxEn;
  const leg2Quality = route.dstLang.cometEnXx;
  return leg1Quality * leg2Quality;
}

/**
 * Returns a user-friendly quality label based on the quality score.
 */
export function getQualityLabel(quality: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (quality >= 0.85) {
    return { label: 'Alta', color: '#4ADE80', emoji: '🟢' };
  }
  if (quality >= 0.75) {
    return { label: 'Buena', color: '#FACC15', emoji: '🟡' };
  }
  if (quality >= 0.65) {
    return { label: 'Aceptable', color: '#FB923C', emoji: '🟠' };
  }
  return { label: 'Limitada', color: '#F87171', emoji: '🔴' };
}
