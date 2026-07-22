import { microfrontendMountId, type MicrofrontendDescriptor } from '@cheshirecode/microfrontend-host';
import { appCardMeta } from './registry';

export type FrameworkVersions = Record<string, string | undefined>;

export interface BuildInfo {
  commit?: string;
  context?: string;
  branch?: string;
  builtAt?: string;
}

export interface ShowcaseOptions {
  versions?: FrameworkVersions;
  build?: BuildInfo;
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildBand(build: BuildInfo): HTMLElement | null {
  const rows: Array<[string, string]> = [];
  if (build.commit) rows.push(['commit', build.commit.slice(0, 7)]);
  if (build.context) rows.push(['context', build.context]);
  if (build.builtAt) {
    const when = new Date(build.builtAt);
    rows.push(['built', Number.isNaN(when.getTime()) ? build.builtAt : when.toISOString().replace('T', ' ').slice(0, 16) + ' UTC']);
  }
  if (rows.length === 0) return null;
  const dl = el('dl', 'masthead__build');
  for (const [term, value] of rows) {
    const wrap = el('div', 'masthead__build-item');
    wrap.append(el('dt', undefined, term), el('dd', undefined, value));
    dl.append(wrap);
  }
  return dl;
}

export function renderShowcase(
  root: Element,
  entries: readonly MicrofrontendDescriptor[],
  options: ShowcaseOptions = {}
): void {
  root.replaceChildren();
  const page = el('div', 'showcase');
  applySavedTheme();

  const masthead = el('header', 'masthead');
  const eyebrowRow = el('div', 'masthead__eyebrow-row');
  const eyebrow = el('span', 'masthead__eyebrow', 'moon · pnpm · monorepo boilerplate');

  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle dark mode');
  const toggleIcon = document.createElement('span');
  toggleIcon.setAttribute('aria-hidden', 'true');
  toggleIcon.textContent = getThemeIcon();
  toggle.append(toggleIcon);
  toggle.addEventListener('click', toggleTheme);
  eyebrowRow.append(eyebrow, toggle);

  masthead.append(eyebrowRow, el('h1', 'masthead__title', 'Six renderers, one host'), el('p', 'masthead__lede', 'Every card is a live microfrontend mounted into this page. Open any one to view it as a standalone app.'));
  const band = options.build ? buildBand(options.build) : null;
  if (band) masthead.append(band);

  const grid = el('section', 'cards');
  grid.setAttribute('aria-label', 'Framework renderers');

  const nav = el('nav', 'nav-strip');
  nav.setAttribute('aria-label', 'Framework apps');
  for (const entry of entries) {
    const meta = appCardMeta[entry.id];
    const link = document.createElement('a');
    link.className = 'nav-strip__link';
    link.href = meta?.href ?? '#';
    link.textContent = meta?.framework ?? entry.title;
    if (meta?.accent) link.style.setProperty('--accent', meta.accent);
    nav.append(link);
  }

  for (const entry of entries) {
    const meta = appCardMeta[entry.id];
    const card = el('article', 'card');
    card.style.setProperty('--accent', meta?.accent ?? 'oklch(0.6 0.02 260)');
    const head = el('div', 'card__head');
    head.append(el('span', 'card__framework', meta?.framework ?? entry.title));
    const version = meta?.versionKey ? options.versions?.[meta.versionKey] : undefined;
    if (version) head.append(el('span', 'card__version', `v${version}`));
    head.append(el('span', 'card__mode', meta?.renderMode ?? entry.kind));
    const preview = el('div', 'card__preview');
    const mount = el('div', 'card__mount');
    mount.id = microfrontendMountId(entry.id);
    mount.setAttribute('aria-hidden', 'true');
    preview.append(mount);
    const cta = document.createElement('a');
    cta.className = 'card__cta';
    cta.href = meta?.href ?? '#';
    cta.textContent = 'Open standalone';
    cta.setAttribute('aria-label', `Open the ${meta?.framework ?? entry.title} demo as a standalone page`);
    const foot = el('div', 'card__foot');
    foot.append(el('p', 'card__tagline', meta?.tagline ?? entry.description ?? ''), cta);
    card.append(head, preview, foot);
    grid.append(card);
  }

  page.append(masthead, nav, grid);
  enableCardKeyboardNav(grid);
  root.append(page);
}

function enableCardKeyboardNav(grid: HTMLElement): void {
  const links = Array.from(grid.querySelectorAll<HTMLAnchorElement>('.card__cta'));
  if (links.length < 2) return;
  grid.addEventListener('keydown', (e) => {
    if (!e.key.startsWith('Arrow')) return;
    if (!links.some((link) => link.contains(e.target as Node))) return;
    const current = document.activeElement as HTMLElement | null;
    const index = current ? links.indexOf(current as HTMLAnchorElement) : -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = index < links.length - 1 ? links[index + 1] : links[0];
      next.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = index > 0 ? links[index - 1] : links[links.length - 1];
      prev.focus();
    }
  });
}

function toggleTheme(): void {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('showcase-theme', next); } catch {}
}

function applySavedTheme(): void {
  try {
    const saved = localStorage.getItem('showcase-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch {}
}

function getThemeIcon(): string {
  const saved = (() => { try { return localStorage.getItem('showcase-theme'); } catch { return null; } })();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return (saved ?? (prefersDark ? 'dark' : 'light')) === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
}
