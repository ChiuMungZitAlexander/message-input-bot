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
        <p class="version">v${packageJson.version}</p>
      </header>

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
