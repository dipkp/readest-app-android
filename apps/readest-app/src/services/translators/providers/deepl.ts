import { stubTranslation as _ } from '@/utils/misc';
import { TranslationProvider } from '../types';
import { normalizeToShortLang } from '@/utils/lang';
import { getAIFetch } from '@/services/ai/utils/httpFetch';
import { useSettingsStore } from '@/store/settingsStore';

export const deeplProvider: TranslationProvider = {
  name: 'deepl',
  label: _('DeepL'),
  authRequired: true,
  quotaExceeded: false,
  translate: async (
    text: string[],
    sourceLang: string,
    targetLang: string,
    _token?: string | null, // legacy token, no longer used for auth here, we read from viewSettings
    _useCache: boolean = false,
  ): Promise<string[]> => {
    const { settings } = useSettingsStore.getState();
    const deeplKey = settings.globalViewSettings.deeplApiKey;

    if (!deeplKey) {
      throw new Error('DeepL API key is required. Please configure it in Translation Settings.');
    }

    const isFreeKey = deeplKey.endsWith(':fx');
    const endpoint = isFreeKey
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `DeepL-Auth-Key ${deeplKey}`,
    };

    const normalizedSourceLang = normalizeToShortLang(sourceLang).toUpperCase();
    const body = JSON.stringify({
      text: text,
      ...(normalizedSourceLang !== 'AUTO' ? { source_lang: normalizedSourceLang } : {}),
      target_lang: normalizeToShortLang(targetLang).toUpperCase(),
    });

    try {
      const response = await getAIFetch()(endpoint, { method: 'POST', headers, body });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('DeepL API key is invalid or unauthorized.');
        } else if (response.status === 456) {
          throw new Error('DeepL translation quota exceeded for this API key.');
        }
        throw new Error(`Translation failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.translations) {
        throw new Error('Invalid response from translation service');
      }

      return text.map((line, i) => {
        if (!line?.trim().length) {
          return line;
        }
        const translation = data.translations?.[i];
        return translation?.text || line;
      });
    } catch (error) {
      throw error;
    }
  },
};
