import 'server-only';
import type { Locale } from './i18n';

type Loader = () => Promise<Record<string, any>>;

const dictionaries: Record<Locale, Loader> = {
    en: () => import('@/dictionaries/en.json').then((m) => m.default),
    tr: () => import('@/dictionaries/tr.json').then((m) => m.default),
};

const contents: Record<Locale, Loader> = {
    en: () => import('@/contents/en.json').then((m) => m.default),
    tr: () => import('@/contents/tr.json').then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
export const getContents = (locale: Locale) => contents[locale]();
export const getSharedData = () => import('@/contents/shared.json').then((m) => m.default);
