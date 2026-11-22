/** Shapes of a locale file. Korean (ko.ts) is the source of truth for every key and id. */
import type * as ko from './ko';

export type MsgKey = keyof typeof ko.messages;
export type CameraId = keyof typeof ko.cameraText.desc;
export type EraKind = keyof typeof ko.cameraText.era;
export type StockId = keyof typeof ko.stockText;

/** Complete message table (en.ts). */
export type Messages = Record<MsgKey, string>;
export interface CameraText {
  desc: Record<CameraId, string>;
  era: Record<EraKind, string>;
}
export type StockText = Record<StockId, string>;

/** What a translated locale file may contain: any subset; the rest falls back to English. */
export type LocaleMessages = Partial<Messages>;
export interface LocaleCameraText {
  desc: Partial<Record<CameraId, string>>;
  era: Partial<Record<EraKind, string>>;
}
export type LocaleStockText = Partial<StockText>;

export interface LocaleModule {
  messages: LocaleMessages;
  cameraText: LocaleCameraText;
  stockText: LocaleStockText;
}
