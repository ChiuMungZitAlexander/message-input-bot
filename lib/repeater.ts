import type { EditableElement } from './editable';
import { simulateInputAndEnter } from './input-simulator';

export interface RepeatConfig {
  text: string;
  count: number;
  intervalMs: number;
  target: EditableElement;
  onProgress: (done: number, total: number) => void;
  signal: AbortSignal;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function runRepeater(config: RepeatConfig): Promise<'completed' | 'aborted'> {
  const { text, count, intervalMs, target, onProgress, signal } = config;

  for (let i = 0; i < count; i++) {
    if (signal.aborted) return 'aborted';

    simulateInputAndEnter(target, text);
    onProgress(i + 1, count);

    if (i < count - 1) {
      try {
        await sleep(intervalMs, signal);
      } catch {
        return 'aborted';
      }
    }
  }

  return 'completed';
}
