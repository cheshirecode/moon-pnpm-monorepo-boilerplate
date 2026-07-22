import { microfrontendMountId } from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';
import { renderShowcase } from './shell';
import './styles.css';

const root = document.getElementById('showcase');

if (!root) {
  throw new Error('Missing renderer showcase root element.');
}

renderShowcase(root, rendererShowcaseEntries, {
  versions: __FRAMEWORK_VERSIONS__,
  build: __BUILD_INFO__
});

// Mount static entries immediately, lazy-mount client entries on viewport entry
const observer = new IntersectionObserver((changes) => {
  for (const change of changes) {
    if (!change.isIntersecting) continue;
    const id = change.target.getAttribute('data-mf-id');
    if (!id) continue;
    const entry = rendererShowcaseEntries.find(e => e.id === id);
    if (!entry || entry.kind === 'static') continue;
    entry.mount(change.target);
    observer.unobserve(change.target);
  }
}, { rootMargin: '100px' });

for (const entry of rendererShowcaseEntries) {
  const mountPoint = root.querySelector<HTMLElement>(`#${microfrontendMountId(entry.id)}`);
  if (!mountPoint) continue;

  if (entry.kind === 'static') {
    const rendered = entry.render();
    mountPoint.replaceChildren(
      typeof rendered === 'string'
        ? document.createRange().createContextualFragment(rendered)
        : rendered
    );
  } else {
    mountPoint.setAttribute('data-mf-id', entry.id);
    observer.observe(mountPoint);
  }
}
