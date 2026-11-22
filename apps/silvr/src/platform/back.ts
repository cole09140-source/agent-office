import { isNative } from './share';

/**
 * Hardware back (Android) closes the top-most sheet first, then walks the
 * in-app history, then returns to the camera, and only then leaves the app.
 */
const sheets: (() => void)[] = [];

export function pushBackHandler(close: () => void): () => void {
  sheets.push(close);
  return () => {
    const i = sheets.lastIndexOf(close);
    if (i >= 0) sheets.splice(i, 1);
  };
}

export async function initNativeBack(opts: { depth: () => number; atRoot: () => boolean; toRoot: () => void }): Promise<void> {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    const top = sheets[sheets.length - 1];
    if (top) top();
    else if (opts.depth() > 0) history.back();
    else if (!opts.atRoot()) opts.toRoot();
    else void App.minimizeApp();
  });
}
