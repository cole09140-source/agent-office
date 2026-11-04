import { signal } from '@preact/signals';
import type { Locale } from '../intl/locales';

/**
 * Resolved UI language (never 'auto'); kept separate from settings so i18n has no store deps.
 * It switches only once the language's messages have loaded (see applyLang).
 */
export const signalLang = signal<Locale>('ko');
