export const WHITELIST_STORAGE_KEY = 'whitelist';

export async function getWhitelist(): Promise<string[]> {
  const result = await browser.storage.local.get(WHITELIST_STORAGE_KEY);
  const value = result[WHITELIST_STORAGE_KEY];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export async function setWhitelist(domains: string[]): Promise<string[]> {
  const unique = [...new Set(domains)];
  await browser.storage.local.set({ [WHITELIST_STORAGE_KEY]: unique });
  return unique;
}

export async function addDomain(domain: string): Promise<string[]> {
  const current = await getWhitelist();
  if (current.includes(domain)) return current;
  return setWhitelist([...current, domain]);
}

export async function removeDomain(domain: string): Promise<string[]> {
  const current = await getWhitelist();
  return setWhitelist(current.filter((item) => item !== domain));
}

export function onWhitelistChanged(
  listener: (domains: string[]) => void,
): () => void {
  const handler = (
    changes: Record<string, { newValue?: unknown }>,
    areaName: string,
  ) => {
    if (areaName !== 'local') return;
    const change = changes[WHITELIST_STORAGE_KEY];
    if (!change) return;
    const next = change.newValue;
    if (!Array.isArray(next)) {
      listener([]);
      return;
    }
    listener(next.filter((item): item is string => typeof item === 'string'));
  };

  browser.storage.onChanged.addListener(handler);
  return () => browser.storage.onChanged.removeListener(handler);
}
