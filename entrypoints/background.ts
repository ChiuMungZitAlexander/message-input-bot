import { DEFAULT_WHITELIST } from '@/config/default-whitelist';
import { domainsToMatchPatterns } from '@/lib/whitelist';
import {
  getWhitelist,
  onWhitelistChanged,
  WHITELIST_STORAGE_KEY,
} from '@/lib/whitelist-storage';

const CONTENT_SCRIPT_ID = 'message-input-bot';
const CONTENT_SCRIPT_PATH = 'content-scripts/content.js';

let syncQueue: Promise<void> = Promise.resolve();

async function applyContentScripts(domains: string[]): Promise<void> {
  const registered = await browser.scripting.getRegisteredContentScripts({
    ids: [CONTENT_SCRIPT_ID],
  });

  if (domains.length === 0) {
    if (registered.length > 0) {
      await browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
    }
    return;
  }

  const script = {
    id: CONTENT_SCRIPT_ID,
    matches: domainsToMatchPatterns(domains),
    js: [CONTENT_SCRIPT_PATH],
    runAt: 'document_idle' as const,
    persistAcrossSessions: true,
  };

  if (registered.length > 0) {
    await browser.scripting.updateContentScripts([script]);
  } else {
    await browser.scripting.registerContentScripts([script]);
  }
}

function syncContentScripts(domains: string[]): Promise<void> {
  syncQueue = syncQueue
    .then(() => applyContentScripts(domains))
    .catch((error) => {
      console.error('[MessageInputBot] Failed to sync content scripts:', error);
    });
  return syncQueue;
}

async function seedDefaultWhitelist(): Promise<void> {
  const result = await browser.storage.local.get(WHITELIST_STORAGE_KEY);
  if (result[WHITELIST_STORAGE_KEY] != null) return;
  await browser.storage.local.set({ [WHITELIST_STORAGE_KEY]: DEFAULT_WHITELIST });
}

async function initWhitelist(): Promise<void> {
  await seedDefaultWhitelist();
  const domains = await getWhitelist();
  await syncContentScripts(domains);
}

export default defineBackground(() => {
  void initWhitelist();

  browser.runtime.onInstalled.addListener(() => {
    void initWhitelist();
  });

  onWhitelistChanged((domains) => {
    void syncContentScripts(domains);
  });
});
