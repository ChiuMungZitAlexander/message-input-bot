const EDITABLE_INPUT_TYPES = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'number',
  'password',
]);

export type EditableElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLElement;

function isContentEditable(el: HTMLElement): boolean {
  const value = el.getAttribute('contenteditable');
  return value === '' || value === 'true';
}

export function isEditableElement(el: Element | null): el is EditableElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('[data-message-input-bot-ui]')) return false;

  if (el instanceof HTMLInputElement) {
    if (el.disabled || el.readOnly) return false;
    const type = (el.type || 'text').toLowerCase();
    return EDITABLE_INPUT_TYPES.has(type);
  }

  if (el instanceof HTMLTextAreaElement) {
    return !el.disabled && !el.readOnly;
  }

  return isContentEditable(el);
}

function findEditableInRoot(
  root: Document | ShadowRoot,
): EditableElement | null {
  const active = root.activeElement;
  if (!active) return null;

  if (isEditableElement(active)) return active;

  if (active instanceof HTMLElement) {
    if (active.shadowRoot) {
      const nested = findEditableInRoot(active.shadowRoot);
      if (nested) return nested;
    }
    const closest = active.closest(
      'input, textarea, [contenteditable="true"], [contenteditable=""]',
    );
    if (isEditableElement(closest)) return closest;
  }

  return null;
}

export function getFocusedEditable(): EditableElement | null {
  return findEditableInRoot(document);
}

export function isElementAttached(el: Element): boolean {
  return el.isConnected;
}
