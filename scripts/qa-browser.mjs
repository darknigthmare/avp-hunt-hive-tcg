import { constants as fsConstants } from 'node:fs';
import { access, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const DEFAULT_URL = 'http://127.0.0.1:4173';
const EXPECTED_TITLE = 'AVP: HUNT // HIVE TCG';
const DEVTOOLS_TIMEOUT_MS = 15_000;
const PAGE_TIMEOUT_MS = 20_000;
const SETTLE_MS = 800;
const TEMP_PREFIX = 'avp-cdp-qa-';
const PROFILES = Object.freeze([
  Object.freeze({ id: 'desktop', width: 1440, height: 1000, mobile: false, touch: false }),
  Object.freeze({ id: 'mobile', width: 390, height: 844, mobile: true, touch: true }),
]);

function usage() {
  return 'Usage: node scripts/qa-browser.mjs [URL] [--chrome PATH]';
}

function parseArguments(argv) {
  let url = DEFAULT_URL;
  let chromePath = process.env.CHROME_PATH || '';
  let sawUrl = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--help' || value === '-h') return { help: true, url, chromePath };
    if (value === '--chrome') {
      chromePath = argv[index + 1] || '';
      index += 1;
      if (!chromePath) throw new Error('--chrome requires an executable path.');
      continue;
    }
    if (value.startsWith('--chrome=')) {
      chromePath = value.slice('--chrome='.length);
      if (!chromePath) throw new Error('--chrome requires an executable path.');
      continue;
    }
    if (value.startsWith('-')) throw new Error(`Unknown option: ${value}`);
    if (sawUrl) throw new Error(`Unexpected argument: ${value}`);
    url = value;
    sawUrl = true;
  }
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('The QA URL must use HTTP or HTTPS.');
  return { help: false, url: parsed.href, chromePath };
}

async function isExecutable(path) {
  if (!path) return false;
  try {
    const info = await stat(path);
    if (!info.isFile()) return false;
    await access(path, process.platform === 'win32' ? fsConstants.F_OK : fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findChrome(explicitPath) {
  const env = process.env;
  const candidates = [
    explicitPath,
    env.CHROME_PATH,
    env.PROGRAMFILES && join(env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env['PROGRAMFILES(X86)'] && join(env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const names = process.platform === 'win32' ? ['chrome.exe', 'chrome'] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const directory of (env.PATH || '').split(process.platform === 'win32' ? ';' : ':').filter(Boolean)) {
    for (const name of names) candidates.push(join(directory, name));
  }
  for (const candidate of [...new Set(candidates.map((item) => resolve(item)))]) {
    if (await isExecutable(candidate)) return candidate;
  }
  throw new Error('Google Chrome was not found. Set CHROME_PATH or pass --chrome PATH.');
}

function boundedAppend(current, chunk, limit = 12_000) {
  const combined = `${current}${String(chunk)}`;
  return combined.length > limit ? combined.slice(-limit) : combined;
}

async function waitForDevTools(userDataDir, child, launchOutput) {
  const activePortPath = join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + DEVTOOLS_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Chrome exited before DevTools became ready (code ${child.exitCode}). ${launchOutput()}`.trim());
    }
    try {
      const [portLine, browserPath] = (await readFile(activePortPath, 'utf8')).trim().split(/\r?\n/);
      const port = Number(portLine);
      if (Number.isInteger(port) && port > 0 && browserPath?.startsWith('/')) return { port, browserPath };
    } catch {
      // Chrome creates DevToolsActivePort asynchronously.
    }
    await delay(50);
  }
  throw new Error(`Chrome DevTools did not become ready within ${DEVTOOLS_TIMEOUT_MS} ms. ${launchOutput()}`.trim());
}

class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => void this.handleMessage(event.data));
    socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('Chrome DevTools connection closed.'));
      this.pending.clear();
    });
  }

  static async connect(url, timeoutMs = 5_000) {
    if (typeof WebSocket !== 'function') throw new Error('This script requires the WebSocket API included with Node.js 24.');
    const socket = new WebSocket(url);
    await Promise.race([
      new Promise((resolveConnection, rejectConnection) => {
        socket.addEventListener('open', resolveConnection, { once: true });
        socket.addEventListener('error', () => rejectConnection(new Error(`Unable to connect to Chrome DevTools at ${url}.`)), { once: true });
      }),
      delay(timeoutMs).then(() => {
        throw new Error(`Timed out connecting to Chrome DevTools at ${url}.`);
      }),
    ]);
    return new CdpConnection(socket);
  }

  async handleMessage(raw) {
    let text;
    if (typeof raw === 'string') text = raw;
    else if (raw instanceof ArrayBuffer) text = Buffer.from(raw).toString('utf8');
    else if (ArrayBuffer.isView(raw)) text = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString('utf8');
    else if (typeof raw?.text === 'function') text = await raw.text();
    else return;
    const message = JSON.parse(text);
    if (message.id) {
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
      else request.resolve(message.result || {});
      return;
    }
    if (!message.method) return;
    for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
  }

  send(method, params = {}) {
    if (this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Chrome DevTools connection is not open.'));
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolveCommand, rejectCommand) => {
      this.pending.set(id, { method, resolve: resolveCommand, reject: rejectCommand });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(listener);
    return () => this.listeners.get(method)?.delete(listener);
  }

  waitFor(method, predicate = () => true, timeoutMs = PAGE_TIMEOUT_MS) {
    return new Promise((resolveEvent, rejectEvent) => {
      const timer = setTimeout(() => {
        unsubscribe();
        rejectEvent(new Error(`Timed out waiting for ${method}.`));
      }, timeoutMs);
      const unsubscribe = this.on(method, (params) => {
        if (!predicate(params)) return;
        clearTimeout(timer);
        unsubscribe();
        resolveEvent(params);
      });
    });
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) this.socket.close();
  }
}

function remoteValue(value) {
  if (Object.hasOwn(value || {}, 'value')) {
    try {
      return typeof value.value === 'string' ? value.value : JSON.stringify(value.value);
    } catch {
      return String(value.value);
    }
  }
  return value?.description || value?.unserializableValue || value?.type || 'unknown';
}

function exceptionRecord(params) {
  const detail = params.exceptionDetails || {};
  return {
    text: detail.exception?.description || detail.text || 'Unhandled runtime exception',
    url: detail.url || null,
    line: Number.isInteger(detail.lineNumber) ? detail.lineNumber + 1 : null,
    column: Number.isInteger(detail.columnNumber) ? detail.columnNumber + 1 : null,
  };
}

function consoleRecord(params) {
  return {
    type: params.type,
    text: (params.args || []).map(remoteValue).join(' '),
    timestamp: params.timestamp || null,
  };
}

function severeLogRecord(params) {
  const entry = params.entry || {};
  return {
    level: 'SEVERE',
    source: entry.source || null,
    text: entry.text || '',
    url: entry.url || null,
    line: entry.lineNumber || null,
  };
}

async function evaluateByValue(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: false,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed.');
  return result.result?.value;
}

async function waitForApplication(cdp) {
  const deadline = Date.now() + PAGE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const ready = await evaluateByValue(cdp, `(() => ({
      ready: document.readyState === 'complete',
      app: Boolean(document.querySelector('#app')?.childElementCount),
      dialog: Boolean(document.querySelector('#modal-root [role="dialog"][aria-modal="true"]'))
    }))()`);
    if (ready?.ready && ready.app && ready.dialog) return;
    await delay(100);
  }
  throw new Error(`The application did not render its content and onboarding modal within ${PAGE_TIMEOUT_MS} ms.`);
}

async function inspectPwa(cdp) {
  const deadline = Date.now() + 5_000;
  let state;
  do {
    state = await evaluateByValue(cdp, `(async () => {
      const manifestHref = document.querySelector('link[rel="manifest"]')?.href || null;
      let manifestStatus = null;
      if (manifestHref) {
        try { manifestStatus = (await fetch(manifestHref, { cache: 'no-store' })).status; }
        catch { manifestStatus = 0; }
      }
      const supported = 'serviceWorker' in navigator;
      const registration = supported ? await navigator.serviceWorker.getRegistration('/') : null;
      return {
        supported,
        manifestHref,
        manifestStatus,
        registered: Boolean(registration),
        scope: registration?.scope || null
      };
    })()`);
    if (state?.supported && state?.manifestStatus === 200 && state?.registered) return state;
    await delay(100);
  } while (Date.now() < deadline);
  return state;
}

const PAGE_INSPECTION = `(() => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const app = document.querySelector('#app');
  const dialog = document.querySelector('#modal-root [role="dialog"]');
  const visibleDialogs = [...document.querySelectorAll('#modal-root [role="dialog"]')]
    .filter((item) => { const style = getComputedStyle(item); const rect = item.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0; });
  const rect = dialog?.getBoundingClientRect();
  const docWidth = document.documentElement.scrollWidth;
  const bodyWidth = document.body.scrollWidth;
  return {
    title: document.title,
    readyState: document.readyState,
    content: {
      appExists: Boolean(app),
      appChildCount: app?.childElementCount || 0,
      appTextLength: (app?.innerText || '').trim().length,
      hasGameName: (app?.textContent || '').includes('HUNT // HIVE'),
      hasFanNotice: (document.querySelector('.fan-project-notice')?.innerText || '').includes('Projet fan non commercial')
    },
    modal: {
      visibleCount: visibleDialogs.length,
      ariaModal: dialog?.getAttribute('aria-modal') === 'true',
      textLength: (dialog?.innerText || '').trim().length,
      choiceCount: dialog?.querySelectorAll('[data-action="choose-starter"]').length || 0,
      withinViewport: Boolean(rect) && rect.left >= -1 && rect.right <= viewportWidth + 1 && rect.top >= -1 && rect.bottom <= viewportHeight + 1,
      horizontalOverflow: Boolean(dialog) && dialog.scrollWidth > dialog.clientWidth + 1,
      bounds: rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null
    },
    overflow: {
      viewportWidth,
      viewportHeight,
      documentWidth: docWidth,
      bodyWidth,
      horizontal: docWidth > viewportWidth + 1 || bodyWidth > viewportWidth + 1
    }
  };
})()`;

function inspectCodexByCdp(cdp){
 return evaluateByValue(cdp, `(async()=>{
  const result={registry:false,catalogue:false,initialRows:0,filterWorked:false,detailOpened:false,linksPresent:false,noHorizontalOverflow:false};
  try{
   const data=window.AVP_ALIEN_BASE;
   result.registry=data?.registry?.v2===632&&Object.keys(data.byCardId||{}).length===158;
   result.catalogue=data?.codex?.entries?.length===68;
   const app=window.AVP_APP;
   if(!app)return {...result,error:'AVP_APP missing'};
   app.state.screen='archive';app.render();
   result.initialRows=document.querySelectorAll('#app .alien-codex-record').length;
   const select=document.querySelector('#app select[data-codex-filter="type"]');
   if(!select)return {...result,error:'codex type select missing'};
   select.value='weapon';select.dispatchEvent(new Event('change',{bubbles:true}));
   const search=document.querySelector('#app input[data-codex-filter="query"]');
   if(!search)return {...result,error:'codex search missing'};
   search.value='M41A';search.dispatchEvent(new Event('input',{bubbles:true}));
   await new Promise(resolve=>setTimeout(resolve,300));
   const visible=[...document.querySelectorAll('#app .alien-codex-record h3')].map(el=>el.textContent.trim());
   result.filterWorked=visible.length>0&&visible.every(name=>name.toLowerCase().includes('m41a'));
   const open=document.querySelector('#app [data-action="codex-detail"]');
   open?.click();
   const modal=document.querySelector('#modal-root [role="dialog"]');
   result.detailOpened=Boolean(modal?.textContent.includes('M41A')&&modal?.textContent.includes('Œuvres de référence'));
   result.linksPresent=Boolean(modal?.querySelector('[data-action="view-card"][data-card-id="EQ_PULSE_RIFLE"]'));
   result.noHorizontalOverflow=document.documentElement.scrollWidth<=window.innerWidth+1;
  }catch(error){result.error=String(error?.message||error)}
  return result;
 })()`);
}

function checksFor(inspection, diagnostics) {
  return {
    documentReady: inspection.readyState === 'complete',
    expectedTitle: inspection.title === EXPECTED_TITLE,
    meaningfulContent: inspection.content.appExists && inspection.content.appChildCount > 0 && inspection.content.appTextLength >= 200 && inspection.content.hasGameName && inspection.content.hasFanNotice,
    onboardingModal: inspection.modal.visibleCount === 1 && inspection.modal.ariaModal && inspection.modal.textLength >= 100 && inspection.modal.choiceCount === 3,
    modalWithinViewport: inspection.modal.withinViewport && !inspection.modal.horizontalOverflow,
    noHorizontalOverflow: !inspection.overflow.horizontal,
    pwaReady: inspection.pwa.supported && inspection.pwa.manifestStatus === 200 && inspection.pwa.registered,
    noRuntimeExceptions: diagnostics.exceptions.length === 0,
    noConsoleErrors: diagnostics.consoleErrors.length === 0,
    noSevereLogs: diagnostics.severeLogs.length === 0,
  };
}

async function inspectProfile(cdp, url, profile, outputPath, diagnostics) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: profile.width,
    height: profile.height,
    deviceScaleFactor: 1,
    mobile: profile.mobile,
    screenWidth: profile.width,
    screenHeight: profile.height,
    positionX: 0,
    positionY: 0,
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: profile.touch, maxTouchPoints: profile.touch ? 5 : 1 });
  const loaded = cdp.waitFor('Page.loadEventFired');
  const navigation = await cdp.send('Page.navigate', { url });
  if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
  await loaded;
  await waitForApplication(cdp);
  await evaluateByValue(cdp, 'document.fonts?.ready.then(() => true) ?? true');
  await delay(SETTLE_MS);
  const inspection = await evaluateByValue(cdp, PAGE_INSPECTION);
  inspection.pwa = await inspectPwa(cdp);
  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
  const checks = checksFor(inspection, diagnostics);
  inspection.codex = await inspectCodexByCdp(cdp);
  checks.codexNavigation = inspection.codex.registry && inspection.codex.catalogue && inspection.codex.initialRows === 18;
  checks.codexFiltering = inspection.codex.filterWorked;
  checks.codexCardLinks = inspection.codex.detailOpened && inspection.codex.linksPresent;
  checks.codexResponsive = inspection.codex.noHorizontalOverflow;
  checks.codexNoRuntimeErrors = diagnostics.exceptions.length === 0 && diagnostics.consoleErrors.length === 0 && diagnostics.severeLogs.length === 0;
  const codexImage = resolve(`.qa-${profile.id}-codex.png`);
  const codexScreenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png', fromSurface: true, captureBeyondViewport: false,
  });
  await writeFile(codexImage, Buffer.from(codexScreenshot.data,'base64'));
  return {
    id: profile.id,
    viewport: { width: profile.width, height: profile.height, mobile: profile.mobile },
    passed: Object.values(checks).every(Boolean),
    checks,
    inspection,
    diagnostics,
    screenshot: outputPath,
    codexScreenshot: codexImage,
  };
}

function safeTempPath(path) {
  return resolve(dirname(path)) === resolve(tmpdir()) && basename(path).startsWith(TEMP_PREFIX);
}

async function removeTempDirectory(path) {
  if (!path || !safeTempPath(path)) throw new Error(`Refusing to remove unexpected temporary path: ${path}`);
  await rm(path, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
}

async function terminateChrome(browserCdp, pageCdp, child) {
  pageCdp?.close();
  if (browserCdp) {
    try {
      await Promise.race([browserCdp.send('Browser.close'), delay(1_500)]);
    } catch {
      // A closed socket is the normal response to Browser.close in some Chrome builds.
    }
    browserCdp.close();
  }
  if (!child || child.exitCode !== null) return;
  await Promise.race([once(child, 'exit'), delay(2_000)]);
  if (child.exitCode === null) child.kill('SIGTERM');
}

async function run() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const chromePath = await findChrome(options.chromePath);
  const userDataDir = await mkdtemp(join(tmpdir(), TEMP_PREFIX));
  let child;
  let browserCdp;
  let pageCdp;
  let launchOutput = '';
  try {
    child = spawn(chromePath, [
      '--headless=new',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--window-size=1440,1000',
      'about:blank',
    ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => { launchOutput = boundedAppend(launchOutput, chunk); });
    child.stderr.on('data', (chunk) => { launchOutput = boundedAppend(launchOutput, chunk); });
    const devtools = await waitForDevTools(userDataDir, child, () => launchOutput.trim());
    browserCdp = await CdpConnection.connect(`ws://127.0.0.1:${devtools.port}${devtools.browserPath}`);
    const targetsResponse = await fetch(`http://127.0.0.1:${devtools.port}/json/list`);
    if (!targetsResponse.ok) throw new Error(`Chrome target listing failed with HTTP ${targetsResponse.status}.`);
    const targets = await targetsResponse.json();
    const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    if (!pageTarget) throw new Error('Chrome did not expose a page target.');
    pageCdp = await CdpConnection.connect(pageTarget.webSocketDebuggerUrl);
    await Promise.all([
      pageCdp.send('Page.enable'),
      pageCdp.send('Runtime.enable'),
      pageCdp.send('Log.enable'),
    ]);
    let activeDiagnostics = null;
    pageCdp.on('Runtime.exceptionThrown', (params) => activeDiagnostics?.exceptions.push(exceptionRecord(params)));
    pageCdp.on('Runtime.consoleAPICalled', (params) => {
      if (['error', 'assert'].includes(params.type)) activeDiagnostics?.consoleErrors.push(consoleRecord(params));
    });
    pageCdp.on('Log.entryAdded', (params) => {
      if (params.entry?.level === 'error') activeDiagnostics?.severeLogs.push(severeLogRecord(params));
    });
    const version = await browserCdp.send('Browser.getVersion');
    const profiles = [];
    for (const profile of PROFILES) {
      activeDiagnostics = { exceptions: [], consoleErrors: [], severeLogs: [] };
      const outputPath = resolve(`.qa-${profile.id}.png`);
      profiles.push(await inspectProfile(pageCdp, options.url, profile, outputPath, activeDiagnostics));
      activeDiagnostics = null;
    }
    const summary = {
      schema: 'avp-browser-qa-v1',
      url: options.url,
      passed: profiles.every((profile) => profile.passed),
      browser: {
        executable: chromePath,
        product: version.product,
        protocolVersion: version.protocolVersion,
        userAgent: version.userAgent,
      },
      totals: {
        profiles: profiles.length,
        failedProfiles: profiles.filter((profile) => !profile.passed).length,
        runtimeExceptions: profiles.reduce((count, profile) => count + profile.diagnostics.exceptions.length, 0),
        consoleErrors: profiles.reduce((count, profile) => count + profile.diagnostics.consoleErrors.length, 0),
        severeLogs: profiles.reduce((count, profile) => count + profile.diagnostics.severeLogs.length, 0),
      },
      profiles,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (!summary.passed) process.exitCode = 1;
  } finally {
    await terminateChrome(browserCdp, pageCdp, child);
    await removeTempDirectory(userDataDir);
  }
}

run().catch((error) => {
  process.stderr.write(`${JSON.stringify({ schema: 'avp-browser-qa-error-v1', passed: false, error: error.message, usage: usage() }, null, 2)}\n`);
  process.exitCode = 1;
});
