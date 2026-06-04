export interface OverlayPosition {
  top: number;
  left: number;
}

const BUTTON_SIZE = 20;
const OFFSET = 4;

export function getTriggerButtonPosition(
  target: Element,
): OverlayPosition | null {
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  const inViewport =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth;
  if (!inViewport) return null;

  return {
    top: rect.top + OFFSET,
    left: rect.right - BUTTON_SIZE - OFFSET,
  };
}

export function getPanelPosition(
  anchor: OverlayPosition,
): OverlayPosition {
  const panelWidth = 260;
  const panelHeight = 220;
  let left = anchor.left - panelWidth + BUTTON_SIZE;
  let top = anchor.top + BUTTON_SIZE + OFFSET;

  if (left < 8) left = 8;
  if (left + panelWidth > window.innerWidth - 8) {
    left = window.innerWidth - panelWidth - 8;
  }
  if (top + panelHeight > window.innerHeight - 8) {
    top = anchor.top - panelHeight - OFFSET;
  }
  if (top < 8) top = 8;

  return { top, left };
}

export const TRIGGER_BUTTON_SIZE = BUTTON_SIZE;
