import { WebContents } from 'electron'

export interface CdpInteractionEntry {
  id: string
  time: string
  action: string
  target: string
  selector: string
}

// Script injected into the target page to track user interactions
const TRACKING_SCRIPT = `
(function() {
  if (window.__reconTracking) return;
  window.__reconTracking = true;

  const startTime = Date.now();
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };

  const send = (action, target, selector) => {
    console.debug('__recon_interaction__', JSON.stringify({
      time: fmt(Date.now() - startTime),
      action, target, selector
    }));
  };

  const getSelector = (el) => {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
      return el.tagName.toLowerCase() + '.' + cls;
    }
    return el.tagName.toLowerCase();
  };

  const getTarget = (el) => {
    const tag = el.tagName?.toLowerCase() || '';
    const text = (el.textContent || '').trim().slice(0, 40);
    if (tag === 'a') return 'Link — "' + text + '"';
    if (tag === 'button') return 'Button — "' + text + '"';
    if (tag === 'input') return 'Input — ' + (el.type || 'text') + ' [' + (el.name || el.id || '') + ']';
    return tag + (text ? ' — "' + text + '"' : '');
  };

  document.addEventListener('click', (e) => {
    send('click', getTarget(e.target), getSelector(e.target));
  }, true);

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      send('input', 'Input — ' + (el.name || el.id || el.type || ''), getSelector(el));
    }
  }, true);

  document.addEventListener('submit', (e) => {
    send('submit', 'Form — ' + (e.target.action || ''), getSelector(e.target));
  }, true);

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      send('scroll', 'Page scrolled to ' + window.scrollY + 'px', 'window');
    }, 200);
  }, true);

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    send('navigate', arguments[2] || '', 'history.pushState');
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    send('navigate', arguments[2] || '', 'history.replaceState');
  };
  window.addEventListener('popstate', () => {
    send('navigate', location.pathname, 'popstate');
  });
})();
`

export class InteractionCapture {
  private debugger: Electron.Debugger
  private onEntry: (entry: CdpInteractionEntry) => void
  private entryCount = 0
  private handler: ((_event: Electron.Event, method: string, params: any) => void) | null = null

  constructor(webContents: WebContents, onEntry: (entry: CdpInteractionEntry) => void) {
    this.debugger = webContents.debugger
    this.onEntry = onEntry
  }

  async start(): Promise<void> {
    if (!this.debugger.isAttached()) {
      this.debugger.attach('1.3')
    }
    await this.debugger.sendCommand('Page.enable')
    await this.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: TRACKING_SCRIPT,
    })
    // Also inject into current page
    try {
      await this.debugger.sendCommand('Runtime.evaluate', {
        expression: TRACKING_SCRIPT,
      })
    } catch {}

    // Listen for the tracking messages from console.debug
    this.handler = (_event, method, params) => {
      if (method === 'Runtime.consoleAPICalled' && params.type === 'debug') {
        const args = params.args || []
        if (args.length >= 2 && args[0]?.value === '__recon_interaction__') {
          try {
            const data = JSON.parse(args[1].value)
            this.onEntry({
              id: `int-${++this.entryCount}`,
              time: data.time,
              action: data.action,
              target: data.target,
              selector: data.selector,
            })
          } catch {}
        }
      }
    }
    this.debugger.on('message', this.handler)
  }

  async stop(): Promise<void> {
    if (this.handler) {
      this.debugger.removeListener('message', this.handler)
      this.handler = null
    }
    try {
      await this.debugger.sendCommand('Page.disable')
    } catch {}
  }
}
