/**
 * EuroNano Translate — Performance Logger
 *
 * Generates JSONL entries for every AI interaction (translation, transcription, synthesis).
 * Schema matches §8 of the design document exactly.
 */

import { Platform } from 'react-native';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EventType = 'nmt_translate' | 'asr_transcribe' | 'tts_synthesize';

export interface PerfLogModel {
  name: string;
  variant: string;
  quantization: string;
  direction: string;
  src_lang: string;
  dst_lang: string;
}

export interface PerfLogHardware {
  device: string;
  os: string;
  ram_gb: number;
  backend: string;
}

export interface PerfLogModelLoad {
  cold_load_ms: number;
  cached: boolean;
}

export interface PerfLogPrompt {
  text: string;
  char_count: number;
  token_count_src: number;
}

export interface PerfLogOutput {
  text: string;
  token_count_dst: number;
}

export interface PerfLogLatency {
  ttft_ms: number;
  total_ms: number;
  throughput_tok_s: number;
}

export interface PerfLogPipelineBreakdown {
  vad: number | null;
  asr: number | null;
  nmt: number | null;
  tts: number | null;
}

export interface PerfLogEntry {
  timestamp: string;
  session_id: string;
  event_type: EventType;
  model: PerfLogModel;
  hardware: PerfLogHardware;
  model_load: PerfLogModelLoad;
  prompt: PerfLogPrompt;
  output: PerfLogOutput;
  latency: PerfLogLatency;
  pipeline_stage_breakdown_ms: PerfLogPipelineBreakdown;
}

// ─── Session Management ─────────────────────────────────────────────────────

let _sessionId: string | null = null;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = generateUUID();
  }
  return _sessionId;
}

export function resetSession(): void {
  _sessionId = null;
}

// ─── Hardware Detection ─────────────────────────────────────────────────────

export function getHardwareInfo(): PerfLogHardware {
  return {
    device: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
    os: `${Platform.OS} ${Platform.Version}`,
    ram_gb: 0, // Will be populated by expo-device at runtime
    backend: 'cpu',
  };
}

// ─── Log Storage ────────────────────────────────────────────────────────────

const logBuffer: PerfLogEntry[] = [];
const MAX_BUFFER_SIZE = 500;

/**
 * Records a performance log entry.
 */
export function logPerfEvent(entry: PerfLogEntry): void {
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    logBuffer.shift(); // Remove oldest entry
  }
  logBuffer.push(entry);
}

/**
 * Returns all logged entries.
 */
export function getLogEntries(): PerfLogEntry[] {
  return [...logBuffer];
}

/**
 * Exports the log as a JSONL string.
 */
export function exportAsJsonl(): string {
  return logBuffer.map(entry => JSON.stringify(entry)).join('\n');
}

/**
 * Clears the log buffer.
 */
export function clearLog(): void {
  logBuffer.length = 0;
}

/**
 * Returns summary statistics from the log.
 */
export function getLogSummary(): {
  totalEvents: number;
  byType: Record<EventType, number>;
  avgLatency: Record<EventType, number>;
  avgThroughput: Record<EventType, number>;
} {
  const byType: Record<EventType, number> = {
    nmt_translate: 0,
    asr_transcribe: 0,
    tts_synthesize: 0,
  };
  const latencySums: Record<EventType, number> = {
    nmt_translate: 0,
    asr_transcribe: 0,
    tts_synthesize: 0,
  };
  const throughputSums: Record<EventType, number> = {
    nmt_translate: 0,
    asr_transcribe: 0,
    tts_synthesize: 0,
  };

  for (const entry of logBuffer) {
    byType[entry.event_type]++;
    latencySums[entry.event_type] += entry.latency.total_ms;
    throughputSums[entry.event_type] += entry.latency.throughput_tok_s;
  }

  const avgLatency: Record<EventType, number> = {
    nmt_translate: byType.nmt_translate ? latencySums.nmt_translate / byType.nmt_translate : 0,
    asr_transcribe: byType.asr_transcribe ? latencySums.asr_transcribe / byType.asr_transcribe : 0,
    tts_synthesize: byType.tts_synthesize ? latencySums.tts_synthesize / byType.tts_synthesize : 0,
  };

  const avgThroughput: Record<EventType, number> = {
    nmt_translate: byType.nmt_translate ? throughputSums.nmt_translate / byType.nmt_translate : 0,
    asr_transcribe: byType.asr_transcribe ? throughputSums.asr_transcribe / byType.asr_transcribe : 0,
    tts_synthesize: byType.tts_synthesize ? throughputSums.tts_synthesize / byType.tts_synthesize : 0,
  };

  return {
    totalEvents: logBuffer.length,
    byType,
    avgLatency,
    avgThroughput,
  };
}

// ─── Helper: Create a perf entry for NMT ────────────────────────────────────

export function createNmtLogEntry(params: {
  variant: string;
  direction: string;
  srcLang: string;
  dstLang: string;
  inputText: string;
  outputText: string;
  tokenCountSrc: number;
  tokenCountDst: number;
  coldLoadMs: number;
  cached: boolean;
  ttftMs: number;
  totalMs: number;
}): PerfLogEntry {
  const throughput = params.totalMs > 0
    ? (params.tokenCountDst / (params.totalMs / 1000))
    : 0;

  return {
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    event_type: 'nmt_translate',
    model: {
      name: 'qvac/TranslatePsy-EuroNano',
      variant: params.variant,
      quantization: 'intgemm-int8',
      direction: params.direction,
      src_lang: params.srcLang,
      dst_lang: params.dstLang,
    },
    hardware: getHardwareInfo(),
    model_load: {
      cold_load_ms: params.coldLoadMs,
      cached: params.cached,
    },
    prompt: {
      text: params.inputText,
      char_count: params.inputText.length,
      token_count_src: params.tokenCountSrc,
    },
    output: {
      text: params.outputText,
      token_count_dst: params.tokenCountDst,
    },
    latency: {
      ttft_ms: params.ttftMs,
      total_ms: params.totalMs,
      throughput_tok_s: Math.round(throughput * 10) / 10,
    },
    pipeline_stage_breakdown_ms: {
      vad: null,
      asr: null,
      nmt: params.totalMs,
      tts: null,
    },
  };
}
