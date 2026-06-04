import type { EditableElement } from '@/lib/editable';
import { getFocusedEditable, isEditableElement } from '@/lib/editable';
import { createPanel, type PanelConfig } from '@/lib/panel';
import { runRepeater } from '@/lib/repeater';
import { createTriggerButton } from '@/lib/trigger-button';

export default defineContentScript({
  registration: 'runtime',
  matches: [],
  main() {
    const trigger = createTriggerButton();
    const panel = createPanel();
    const uiHosts = new Set([trigger.getHost(), panel.getHost()]);

    let activeEditable: EditableElement | null = null;
    let hideTimer: number | null = null;
    let abortController: AbortController | null = null;

    function isFocusInsideUi(target: EventTarget | null): boolean {
      if (!(target instanceof Node)) return false;
      for (const host of uiHosts) {
        if (host.contains(target) || host.shadowRoot?.contains(target)) return true;
      }
      return false;
    }

    function clearHideTimer(): void {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    function scheduleHide(): void {
      clearHideTimer();
      hideTimer = window.setTimeout(() => {
        if (panel.isOpen()) return;
        activeEditable = null;
        trigger.hide();
      }, 150);
    }

    function showForEditable(editable: EditableElement): void {
      clearHideTimer();
      activeEditable = editable;
      trigger.show(editable);
    }

    function handleFocusIn(event: FocusEvent): void {
      if (isFocusInsideUi(event.target)) {
        clearHideTimer();
        return;
      }

      const editable = getFocusedEditable();
      if (editable) {
        showForEditable(editable);
        return;
      }

      if (event.target instanceof Element && isEditableElement(event.target)) {
        showForEditable(event.target);
      }
    }

    function handleFocusOut(event: FocusEvent): void {
      if (isFocusInsideUi(event.relatedTarget)) {
        clearHideTimer();
        return;
      }
      if (panel.isOpen()) return;
      scheduleHide();
    }

    async function startRepeating(
      config: PanelConfig,
      target: EditableElement,
    ): Promise<void> {
      abortController?.abort();
      abortController = new AbortController();
      const signal = abortController.signal;

      panel.setRunning(true);

      const result = await runRepeater({
        text: config.text,
        count: config.count,
        intervalMs: Math.round(config.intervalSeconds * 1000),
        target,
        signal,
        onProgress(done, total) {
          panel.setProgress(done, total);
        },
      });

      panel.setRunning(false);
      abortController = null;

      if (result === 'completed') {
        panel.showComplete();
      }
    }

    trigger.setOnClick((anchor) => {
      if (!activeEditable) return;
      panel.open(anchor, activeEditable);
    });

    panel.setOnStart((config, target) => {
      void startRepeating(config, target);
    });

    panel.setOnStop(() => {
      abortController?.abort();
      abortController = null;
      panel.setRunning(false);
    });

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
  },
});
