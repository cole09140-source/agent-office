import { signal } from '@preact/signals';

/** Resolved UI language; kept separate from settings so i18n has no store deps. */
export const signalLang = signal<'ko' | 'en'>('ko');
