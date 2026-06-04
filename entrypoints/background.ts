import { DEFAULT_WHITELIST } from '@/config/default-whitelist';
import { domainsToMatchPatterns } from '@/lib/whitelist';
import {
  getWhitelist,
  onWhitelistChanged,
  WHITELIST_STORAGE_KEY,
} from '@/lib/whitelist-storage';

const CONTENT_SCRIPT_ID = 'message-input-bot';
const CONTENT_SCRIPT_PATH = 'content-scripts/content.js';

async function syncContentScripts(domains: string[]): Promise<void> {
  try {
    await browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // Not registered yet.
  }

  if (domains.length === 0) return;

  await browser.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      matches: domainsToMatchPatterns(domains),
      js: [CONTENT_SCRIPT_PATH],
      runAt: 'document_idle',
      persistAcrossSessions: true,
    },
  ]);
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
