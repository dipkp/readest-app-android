import type { AISettings } from './types';

export const GEMINI_MODELS = {
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
} as const;

export const GROQ_MODELS = {
  LLAMA_3_1_8B_INSTANT: 'llama-3.1-8b-instant',
  LLAMA_3_1_70B_VERSATILE: 'llama-3.1-70b-versatile',
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
} as const;

export const MODEL_PRICING: Record<string, { input: string; output: string }> = {
  [GEMINI_MODELS.GEMINI_2_5_FLASH_LITE]: { input: '0.075', output: '0.3' },
  [GEMINI_MODELS.GEMINI_2_5_FLASH]: { input: '0.075', output: '0.3' },
  [GEMINI_MODELS.GEMINI_2_5_PRO]: { input: '1.25', output: '5.0' },
  [GROQ_MODELS.LLAMA_3_1_8B_INSTANT]: { input: '0.05', output: '0.08' },
  [GROQ_MODELS.LLAMA_3_1_70B_VERSATILE]: { input: '0.59', output: '0.79' },
  [GROQ_MODELS.MIXTRAL_8X7B]: { input: '0.24', output: '0.24' },
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  provider: 'ollama',

  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  ollamaEmbeddingModel: 'nomic-embed-text',

  geminiModel: 'gemini-2.5-flash-lite',
  geminiEmbeddingModel: 'text-embedding-004',

  groqModel: 'llama-3.1-8b-instant',
  groqEmbeddingModel: 'nomic-embed-text',

  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  openrouterModel: '',
  openrouterEmbeddingModel: '',

  spoilerProtection: true,
  maxContextChunks: 10,
  indexingMode: 'on-demand',
  reedy: { enabled: false },
};
