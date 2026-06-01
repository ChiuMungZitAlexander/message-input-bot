import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const browsersPath = path.join(rootDir, '.playwright-browsers');
const playwrightCli = path.join(
  rootDir,
  'node_modules',
  '@playwright/test',
  'cli.js',
);

process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

const { chromium } = await import('@playwright/test');

function getChromiumExecutable() {
  try {
    return chromium.executablePath();
  } catch {
    return null;
  }
}

function isChromiumInstalled() {
  const executable = getChromiumExecutable();
  return executable != null && fs.existsSync(executable);
}

function installChromium() {
  console.log('');
  console.log(`Installing Playwright Chromium to ${browsersPath}`);
  console.log('Downloading browser binaries (~170 MB, one-time)...');
  console.log(
    'Slow network? Try: PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright bun run test:e2e',
  );
  console.log('');

  const installArgs = ['install', 'chromium'];
  if (process.env.CI && process.platform === 'linux') {
    installArgs.push('--with-deps');
  }

  const result = spawnSync(process.execPath, [playwrightCli, ...installArgs], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    console.error('');
    console.error('Failed to install Playwright Chromium.');
    process.exit(result.status ?? 1);
  }
}

function installLinuxDepsIfNeeded() {
  if (!process.env.CI || process.platform !== 'linux') return;

  const result = spawnSync(
    process.execPath,
    [playwrightCli, 'install-deps', 'chromium'],
    {
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    console.error('');
    console.error('Failed to install Playwright system dependencies.');
    process.exit(result.status ?? 1);
  }
}

if (!isChromiumInstalled()) {
  installChromium();
} else {
  installLinuxDepsIfNeeded();
}

if (!isChromiumInstalled()) {
  console.error('');
  console.error('Playwright Chromium is still missing after install.');
  console.error(`Expected executable under: ${browsersPath}`);
  process.exit(1);
}

console.log(`Playwright Chromium is ready (${getChromiumExecutable()}).`);
