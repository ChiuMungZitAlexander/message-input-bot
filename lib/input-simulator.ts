import type { EditableElement } from './editable';

function getNativeValueSetter(
  el: HTMLInputElement | HTMLTextAreaElement,
): ((value: string) => void) | null {
  const proto =
    el instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (!descriptor?.set) return null;
  return (value: string) => descriptor.set!.call(el, value);
}

function dispatchInputEvent(el: Element): void {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function dispatchEnter(el: Element): void {
  const init: KeyboardEventInit = {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  };
  el.dispatchEvent(new KeyboardEvent('keydown', init));
  el.dispatchEvent(new KeyboardEvent('keypress', init));
  el.dispatchEvent(new KeyboardEvent('keyup', init));
}

function clearInput(el: HTMLInputElement | HTMLTextAreaElement): void {
  const setter = getNativeValueSetter(el);
  if (setter) {
    setter('');
  } else {
    el.value = '';
  }
  dispatchInputEvent(el);
}

function setInputValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): void {
  const setter = getNativeValueSetter(el);
  if (setter) {
    setter(text);
  } else {
    el.value = text;
  }
  dispatchInputEvent(el);
}

function clearContentEditable(el: HTMLElement): void {
  el.focus();
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  document.execCommand('delete', false);
  el.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }),
  );
}

function insertContentEditable(el: HTMLElement, text: string): void {
  el.focus();
  if (!document.execCommand('insertText', false, text)) {
    el.textContent = text;
    el.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }),
    );
  }
}

export function simulateInputAndEnter(el: EditableElement, text: string): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
    clearInput(el);
    setInputValue(el, text);
    dispatchEnter(el);
    return;
  }

  clearContentEditable(el);
  insertContentEditable(el, text);
  dispatchEnter(el);
}
