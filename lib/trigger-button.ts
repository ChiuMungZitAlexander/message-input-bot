import type { EditableElement } from './editable';
import { isElementAttached } from './editable';
import {
  getTriggerButtonPosition,
  TRIGGER_BUTTON_SIZE,
  type OverlayPosition,
} from './positioning';

const UI_STYLES = `
  :host {
    all: initial;
  }

  .trigger-btn {
    position: fixed;
    width: ${TRIGGER_BUTTON_SIZE}px;
    height: ${TRIGGER_BUTTON_SIZE}px;
    padding: 0;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.85);
    color: #555;
    cursor: pointer;
    opacity: 0.5;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    z-index: 2147483646;
    transition: opacity 0.15s ease;
  }

  .trigger-btn.visible {
    display: flex;
  }

  .trigger-btn:hover {
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.95);
  }

  .trigger-btn svg {
    width: 14px;
    height: 14px;
    pointer-events: none;
  }
`;

export interface TriggerButtonController {
  show(target: EditableElement): void;
  hide(): void;
  setOnClick(handler: (anchor: OverlayPosition) => void): void;
  getAnchor(): OverlayPosition | null;
  isVisible(): boolean;
  getHost(): HTMLElement;
}

export function createTriggerButton(): TriggerButtonController {
  const host = document.createElement('div');
  host.setAttribute('data-message-input-bot-ui', 'trigger');
  host.style.all = 'initial';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = UI_STYLES;
  shadow.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trigger-btn';
  button.title = 'Message Input Bot';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M17 2l4 4-4 4"/>
      <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
      <path d="M7 22l-4-4 4-4"/>
      <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </svg>
  `;
  shadow.appendChild(button);

  let currentTarget: EditableElement | null = null;
  let anchor: OverlayPosition | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let onClickHandler: ((anchor: OverlayPosition) => void) | null = null;

  function updatePosition(): void {
    if (!currentTarget || !isElementAttached(currentTarget)) {
      hideInternal();
      return;
    }

    const pos = getTriggerButtonPosition(currentTarget);
    if (!pos) {
      button.classList.remove('visible');
      anchor = null;
      return;
    }

    anchor = pos;
    button.style.top = `${pos.top}px`;
    button.style.left = `${pos.left}px`;
    button.classList.add('visible');
  }

  function hideInternal(): void {
    currentTarget = null;
    anchor = null;
    button.classList.remove('visible');
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  function show(target: EditableElement): void {
    if (currentTarget === target && button.classList.contains('visible')) {
      updatePosition();
      return;
    }

    currentTarget = target;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(target);
    updatePosition();
  }

  function hide(): void {
    hideInternal();
  }

  button.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (anchor && onClickHandler) onClickHandler(anchor);
  });

  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);

  return {
    show,
    hide,
    setOnClick(handler) {
      onClickHandler = handler;
    },
    getAnchor() {
      return anchor;
    },
    isVisible() {
      return button.classList.contains('visible');
    },
    getHost() {
      return host;
    },
  };
}
