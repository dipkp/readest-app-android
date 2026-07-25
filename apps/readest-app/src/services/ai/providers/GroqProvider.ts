import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings } from '../types';
import { getAIFetch } from '../utils/httpFetch';
import { GROQ_MODELS } from '../constants';

export class GroqProvider implements AIProvider {
  id = 'groq' as const;
  name = 'Groq';
  requiresAuth = true;

  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  private getSdkProvider() {
    return createOpenAICompatible({
      name: 'groq',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: this.settings.groqApiKey,
      fetch: getAIFetch(),
    });
  }

  getModel(): LanguageModel {
    const modelId =
      this.settings.groqCustomModel ||
      this.settings.groqModel ||
      GROQ_MODELS.LLAMA_3_1_8B_INSTANT;
    return this.getSdkProvider()(modelId);
  }

  getEmbeddingModel(): EmbeddingModel {
    // Groq does not currently provide native embedding models; we can fallback to nomic-embed-text or whatever is configured.
    const modelId = this.settings.groqEmbeddingModel || 'nomic-embed-text';
    return this.getSdkProvider().textEmbeddingModel(modelId);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.settings.groqApiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.settings.groqApiKey) return false;

    try {
      // Use the generic fetch configured for AI models which handles Tauri CORS bypass correctly
      const response = await getAIFetch()('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${this.settings.groqApiKey}`,
        },
      });
      return response.ok;
    } catch (_err) {
      return false;
    }
  }
}
