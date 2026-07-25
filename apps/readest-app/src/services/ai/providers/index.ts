import { OllamaProvider } from './OllamaProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import type { AIProvider, AISettings } from '../types';

export { OllamaProvider, GeminiProvider, GroqProvider, OpenRouterProvider };

export function getAIProvider(settings: AISettings): AIProvider {
  switch (settings.provider) {
    case 'ollama':
      return new OllamaProvider(settings);
    case 'google-gemini':
      if (!settings.geminiApiKey) {
        throw new Error('API key required for Google Gemini');
      }
      return new GeminiProvider(settings);
    case 'groq':
      if (!settings.groqApiKey) {
        throw new Error('API key required for Groq');
      }
      return new GroqProvider(settings);
    case 'openrouter':
      if (!settings.openrouterApiKey) {
        throw new Error('API key required for OpenRouter');
      }
      return new OpenRouterProvider(settings);
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}
