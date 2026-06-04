import type { EditableElement } from './editable';
import { getPanelPosition, type OverlayPosition } from './positioning';

export interface PanelConfig {
  text: string;
  count: number;
  intervalSeconds: number;
  intervalJitter: boolean;
}

export interface PanelController {
  open(anchor: OverlayPosition, target: EditableElement): void;
  close(): void;
  isOpen(): boolean;
  setOnStart(handler: (config: PanelConfig, target: EditableElement) => void): void;
  setOnStop(handler: () => void): void;
  setRunning(running: boolean): void;
  setProgress(done: number, total: number): void;
  showComplete(): void;
  getHost(): HTMLElement;
}

const PANEL_STYLES = `
  :host {
    all: initial;
  }

  .panel {
    position: fixed;
    width: 260px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #222;
    z-index: 2147483647;
    display: none;
  }

  .panel.visible {
    display: block;
  }

  .panel h3 {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
  }

  label {
    display: block;
    margin-bottom: 8px;
  }

  label span {
    display: block;
    margin-bottom: 4px;
    color: #555;
    font-size: 12px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
  }

  input:disabled {
    background: #f5f5f5;
    color: #888;
  }

  .row {
    display: flex;
    gap: 8px;
  }

  .row label {
    flex: 1;
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  button {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f8f8f8;
    font-size: 12px;
    cursor: pointer;
  }

  button.primary {
    background: #4a90d9;
    border-color: #3a7bc8;
    color: #fff;
  }

  button.danger {
    background: #e74c3c;
    border-color: #c0392b;
    color: #fff;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #c0392b;
    font-size: 12px;
    min-height: 16px;
    margin-top: 4px;
  }

  .progress {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    min-height: 16px;
  }

  .complete {
    color: #27ae60;
  }

  label.jitter {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  label.jitter span.jitter-label {
    display: inline;
    margin-bottom: 0;
    flex: 1;
    color: #555;
    font-size: 12px;
  }

  label.jitter input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .help-wrap {
    position: relative;
    flex: none;
  }

  .help-btn {
    flex: none;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px solid #bbb;
    border-radius: 50%;
    background: #f5f5f5;
    color: #666;
    font-size: 11px;
    line-height: 1;
    cursor: help;
  }

  .help-btn:disabled {
    cursor: not-allowed;
  }

  .help-tooltip {
    display: none;
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    width: 200px;
    padding: 6px 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    color: #444;
    font-size: 11px;
    line-height: 1.4;
    z-index: 1;
  }

  .help-wrap:hover .help-tooltip,
  .help-wrap:focus-within .help-tooltip {
    display: block;
  }
`;

export function createPanel(): PanelController {
  const host = document.createElement('div');
  host.setAttribute('data-message-input-bot-ui', 'panel');
  host.style.all = 'initial';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = PANEL_STYLES;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h3>重复输入</h3>
    <label>
      <span>重复内容</span>
      <input type="text" data-field="text" placeholder="要发送的内容" />
    </label>
    <div class="row">
      <label>
        <span>重复次数</span>
        <input type="number" data-field="count" min="1" max="999" value="3" />
      </label>
      <label>
        <span>间隔（秒）</span>
        <input type="number" data-field="interval" min="0.1" step="0.1" value="2" />
      </label>
    </div>
    <label class="jitter">
      <input type="checkbox" data-field="jitter" />
      <span class="jitter-label">随机抖动</span>
      <span class="help-wrap">
        <button type="button" class="help-btn" aria-label="随机抖动说明">?</button>
        <span class="help-tooltip">开启后，每次发送间隔会在设定值的 ±10% 范围内随机浮动，避免固定节奏被检测。</span>
      </span>
    </label>
    <div class="error" data-role="error"></div>
    <div class="progress" data-role="progress"></div>
    <div class="actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="button" class="primary" data-action="start">开始</button>
      <button type="button" class="danger" data-action="stop" hidden>停止</button>
    </div>
  `;
  shadow.appendChild(panel);

  const textInput = panel.querySelector<HTMLInputElement>('[data-field="text"]')!;
  const countInput = panel.querySelector<HTMLInputElement>('[data-field="count"]')!;
  const intervalInput = panel.querySelector<HTMLInputElement>('[data-field="interval"]')!;
  const jitterCheckbox = panel.querySelector<HTMLInputElement>('[data-field="jitter"]')!;
  const helpBtn = panel.querySelector<HTMLButtonElement>('.help-btn')!;
  const errorEl = panel.querySelector<HTMLElement>('[data-role="error"]')!;
  const progressEl = panel.querySelector<HTMLElement>('[data-role="progress"]')!;
  const cancelBtn = panel.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
  const startBtn = panel.querySelector<HTMLButtonElement>('[data-action="start"]')!;
  const stopBtn = panel.querySelector<HTMLButtonElement>('[data-action="stop"]')!;

  let currentTarget: EditableElement | null = null;
  let onStartHandler: ((config: PanelConfig, target: EditableElement) => void) | null = null;
  let onStopHandler: (() => void) | null = null;
  let running = false;

  function setInputsDisabled(disabled: boolean): void {
    textInput.disabled = disabled;
    countInput.disabled = disabled;
    intervalInput.disabled = disabled;
    jitterCheckbox.disabled = disabled;
    helpBtn.disabled = disabled;
    cancelBtn.disabled = disabled;
    startBtn.hidden = disabled;
    stopBtn.hidden = !disabled;
  }

  function validate(): PanelConfig | null {
    const text = textInput.value.trim();
    const count = Number(countInput.value);
    const intervalSeconds = Number(intervalInput.value);

    if (!text) {
      errorEl.textContent = '请输入重复内容';
      return null;
    }
    if (!Number.isInteger(count) || count < 1 || count > 999) {
      errorEl.textContent = '重复次数需为 1–999 的整数';
      return null;
    }
    if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
      errorEl.textContent = '间隔时间需大于 0';
      return null;
    }

    errorEl.textContent = '';
    return { text, count, intervalSeconds, intervalJitter: jitterCheckbox.checked };
  }

  function open(anchor: OverlayPosition, target: EditableElement): void {
    currentTarget = target;
    const pos = getPanelPosition(anchor);
    panel.style.top = `${pos.top}px`;
    panel.style.left = `${pos.left}px`;
    panel.classList.add('visible');
    errorEl.textContent = '';
    progressEl.textContent = '';
    progressEl.classList.remove('complete');
    setInputsDisabled(false);
    running = false;
    textInput.focus();
  }

  function close(): void {
    panel.classList.remove('visible');
    currentTarget = null;
    running = false;
    setInputsDisabled(false);
    errorEl.textContent = '';
    progressEl.textContent = '';
    progressEl.classList.remove('complete');
  }

  cancelBtn.addEventListener('click', () => {
    if (!running) close();
  });

  startBtn.addEventListener('click', () => {
    if (!currentTarget || !onStartHandler) return;
    const config = validate();
    if (!config) return;
    running = true;
    setInputsDisabled(true);
    progressEl.textContent = `已发送 0 / ${config.count}`;
    onStartHandler(config, currentTarget);
  });

  stopBtn.addEventListener('click', () => {
    onStopHandler?.();
  });

  return {
    open,
    close,
    isOpen() {
      return panel.classList.contains('visible');
    },
    setOnStart(handler) {
      onStartHandler = handler;
    },
    setOnStop(handler) {
      onStopHandler = handler;
    },
    setRunning(isRunning) {
      running = isRunning;
      setInputsDisabled(isRunning);
    },
    setProgress(done, total) {
      progressEl.textContent = `已发送 ${done} / ${total}`;
      progressEl.classList.remove('complete');
    },
    showComplete() {
      progressEl.textContent = '已完成';
      progressEl.classList.add('complete');
      running = false;
      setInputsDisabled(false);
      window.setTimeout(() => close(), 2000);
    },
    getHost() {
      return host;
    },
  };
}
