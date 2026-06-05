const BLOCKED_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'about:',
  'moz-extension:',
  'edge:',
  'data:',
  'javascript:',
  'file:',
]);

const DOMAIN_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (BLOCKED_PROTOCOLS.has(parsed.protocol)) return null;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return null;
    const hostname = parsed.hostname;
    if (!hostname) return null;
    return hostname;
  } catch {
    return null;
  }
}

export function domainToMatchPattern(domain: string): string {
  return `*://${domain}/*`;
}

export function domainsToMatchPatterns(domains: string[]): string[] {
  return domains.map(domainToMatchPattern);
}

export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (trimmed.includes('://')) {
    const hostname = extractHostname(trimmed);
    if (!hostname) return null;
    candidate = hostname;
  } else {
    candidate = trimmed.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';
    candidate = candidate.split(':')[0] ?? '';
  }

  candidate = candidate.toLowerCase();
  if (!candidate || !isValidDomain(candidate)) return null;
  return candidate;
}

function isValidDomain(domain: string): boolean {
  if (IPV4_PATTERN.test(domain)) {
    return domain.split('.').every((part) => {
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  }
  return DOMAIN_PATTERN.test(domain);
}
