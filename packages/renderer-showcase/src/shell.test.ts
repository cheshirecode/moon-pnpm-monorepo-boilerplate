import { describe, expect, it } from 'vitest';

import { mountMicrofrontends } from '@cheshirecode/microfrontend-host';

import { appCardMeta, rendererShowcaseEntries } from './registry';
import { renderShowcase } from './shell';

describe('renderer showcase shell', () => {
  it('renders a clickable, metadata-rich card with a live mount point per app', () => {
    const root = document.createElement('main');

    renderShowcase(root, rendererShowcaseEntries, {
      versions: { react: '19.2.7', vue: '3.5.39' },
      build: { commit: 'abcdef1234567', context: 'production', builtAt: '2026-07-20T00:00:00.000Z' }
    });

    const cards = root.querySelectorAll('article.card');
    expect(cards.length).toBe(rendererShowcaseEntries.length);

    for (const entry of rendererShowcaseEntries) {
      const meta = appCardMeta[entry.id];
      // Each card has a stretched CTA link to its standalone page and a mount target.
      const link = root.querySelector<HTMLAnchorElement>(`a.card__cta[href="${meta.href}"]`);
      expect(link, `link for ${entry.id}`).not.toBeNull();
      expect(root.querySelector(`#microfrontend-${entry.id}`)).not.toBeNull();
    }

    // Metadata + build band are rendered.
    expect(root.textContent).toContain('React');
    expect(root.textContent).toContain('v19.2.7');
    expect(root.textContent).toContain('SSR + hydration');
    expect(root.textContent).toContain('abcdef1');
    expect(root.textContent).toContain('production');

    // mountMicrofrontends still hydrates every card's preview.
    const mounted = mountMicrofrontends(root, rendererShowcaseEntries);
    expect(mounted.length).toBe(rendererShowcaseEntries.length);
    for (const m of mounted) m.unmount();
  });

  it('omits the build band when no build info is provided', () => {
    const root = document.createElement('main');
    renderShowcase(root, rendererShowcaseEntries, {});
    expect(root.querySelector('.masthead__build')).toBeNull();
    expect(root.querySelectorAll('article.card').length).toBe(rendererShowcaseEntries.length);
  });
});
