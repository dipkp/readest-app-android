import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

export class GeminiProvider implements AIProvider {
  id: AIProviderName = 'google-gemini';
  name = 'Google Gemini';
  requiresAuth = true;

  private settings: AISettings;
  private client: ReturnType<typeof createOpenAICompatible>;
  private apiKey: string;
  private httpFetch: typeof fetch;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.geminiApiKey) {
      throw new Error('Google Gemini API key required');
    }
    this.apiKey = settings.geminiApiKey;
    this.httpFetch = getAIFetch();
    this.client = createOpenAICompatible({
      name: 'google',
      baseURL: DEFAULT_BASE_URL,
      apiKey: this.apiKey,
      fetch: this.httpFetch,
    });
    aiLogger.provider.init('google-gemini', settings.geminiModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel {
    const modelId = this.settings.geminiModel || DEFAULT_MODEL;
    return this.client.chatModel(modelId);
  }

  getEmbeddingModel(): EmbeddingModel {
    const modelId = this.settings.geminiEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    return this.client.textEmbeddingModel(modelId);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const modelId = this.settings.geminiModel || DEFAULT_MODEL;
      aiLogger.provider.init('google-gemini', `healthCheck starting with model: ${modelId}`);
      
      // Hit models endpoint to verify key is valid
      const response = await this.httpFetch(`${DEFAULT_BASE_URL}models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
      });
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      aiLogger.provider.init('google-gemini', 'healthCheck success');
      return true;
    } catch (e) {
      aiLogger.provider.error('google-gemini', `healthCheck failed: ${(e as Error).message}`);
      return false;
    }
  }
}
