import './style.css';
import packageJson from '../../package.json';
import { extractHostname, normalizeDomain } from '@/lib/whitelist';
import {
  addDomain,
  getWhitelist,
  onWhitelistChanged,
  removeDomain,
} from '@/lib/whitelist-storage';

const PLUGIN_NAME = 'MessageInputBot';
const REPO_URL =
  packageJson.homepage ??
  'https://github.com/ChiuMungZitAlexander/message-input-bot';
const BUG_REPORT_URL = `${packageJson.bugs?.url ?? `${REPO_URL}/issues`}/new`;

const GITHUB_ICON_SVG = `<svg class="footer-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.18.82.63-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.51-1.04 2.18-.82 2.18-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;

interface ViewState {
  whitelist: string[];
  currentHostname: string | null;
  canAddCurrent: boolean;
  notice: string | null;
}

let state: ViewState = {
  whitelist: [],
  currentHostname: null,
  canAddCurrent: false,
  notice: null,
};

const app = document.querySelector<HTMLDivElement>('#app')!;

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isCurrentWhitelisted(): boolean {
  return (
    state.currentHostname != null &&
    state.whitelist.includes(state.currentHostname)
  );
}

function render(): void {
  const currentLabel = state.canAddCurrent
    ? state.currentHostname ?? '未知'
    : '此页面无法添加';

  const currentAction = state.canAddCurrent
    ? isCurrentWhitelisted()
      ? `<button type="button" class="btn btn-secondary" data-action="remove-current">移出白名单</button>`
      : `<button type="button" class="btn btn-primary" data-action="add-current">加入白名单</button>`
    : '';

  const listItems =
    state.whitelist.length === 0
      ? '<li class="empty-item">暂无白名单网站</li>'
      : state.whitelist
          .map(
            (domain) => `
              <li class="list-item">
                <span class="domain">${escapeHtml(domain)}</span>
                <button type="button" class="btn btn-danger btn-small" data-action="remove" data-domain="${escapeHtml(domain)}">删除</button>
              </li>
            `,
          )
          .join('');

  app.innerHTML = `
    <div class="popup">
      <header class="header">
        <h1 class="name">${PLUGIN_NAME}</h1>
      </header>

      <div class="popup-body">
      <section class="section">
        <h2 class="section-title">当前网站</h2>
        <p class="current-site">${escapeHtml(currentLabel)}</p>
        ${currentAction}
      </section>

      <section class="section">
        <h2 class="section-title">手动添加</h2>
        <form class="add-form" data-action="manual-add">
          <input
            type="text"
            class="input"
            name="domain"
            placeholder="example.com"
            autocomplete="off"
          />
          <button type="submit" class="btn btn-primary">添加</button>
        </form>
      </section>

      <section class="section">
        <h2 class="section-title">白名单</h2>
        <ul class="domain-list">${listItems}</ul>
      </section>

      ${
        state.notice
          ? `<p class="notice">${escapeHtml(state.notice)}</p>`
          : ''
      }
      </div>

      <footer class="footer">
        <p class="version">v${packageJson.version}</p>
        <a class="footer-link" href="${escapeHtml(REPO_URL)}" target="_blank" rel="noopener noreferrer">
          ${GITHUB_ICON_SVG}
          GitHub
        </a>
        <a class="footer-link footer-link-bug" href="${escapeHtml(BUG_REPORT_URL)}" target="_blank" rel="noopener noreferrer">
          Report a bug
        </a>
      </footer>
    </div>
  `;
}

function showNotice(message: string): void {
  state.notice = message;
  render();
  window.setTimeout(() => {
    state.notice = null;
    render();
  }, 3000);
}

async function loadCurrentTab(): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url) {
      state.currentHostname = null;
      state.canAddCurrent = false;
      return;
    }
    const hostname = extractHostname(tab.url);
    state.currentHostname = hostname;
    state.canAddCurrent = hostname != null;
  } catch {
    state.currentHostname = null;
    state.canAddCurrent = false;
  }
}

async function refreshWhitelist(): Promise<void> {
  state.whitelist = await getWhitelist();
}

async function init(): Promise<void> {
  await Promise.all([refreshWhitelist(), loadCurrentTab()]);
  render();
}

app.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  if (action === 'add-current') {
    void (async () => {
      if (!state.currentHostname) return;
      state.whitelist = await addDomain(state.currentHostname);
      render();
      showNotice('已加入白名单，刷新页面后生效');
    })();
    return;
  }

  if (action === 'remove-current') {
    void (async () => {
      if (!state.currentHostname) return;
      state.whitelist = await removeDomain(state.currentHostname);
      render();
      showNotice('已移出白名单，刷新页面后生效');
    })();
    return;
  }

  if (action === 'remove') {
    const domain = button.dataset.domain;
    if (!domain) return;
    void (async () => {
      state.whitelist = await removeDomain(domain);
      render();
      showNotice('已删除，刷新页面后生效');
    })();
  }
});

app.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.dataset.action !== 'manual-add') return;
  event.preventDefault();

  const input = form.querySelector<HTMLInputElement>('input[name="domain"]');
  if (!input) return;

  const domain = normalizeDomain(input.value);
  if (!domain) {
    showNotice('请输入有效的域名');
    return;
  }

  void (async () => {
    state.whitelist = await addDomain(domain);
    input.value = '';
    render();
    showNotice('已加入白名单，刷新页面后生效');
  })();
});

onWhitelistChanged((domains) => {
  state.whitelist = domains;
  render();
});

void init();
