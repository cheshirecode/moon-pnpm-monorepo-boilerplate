export interface MicrofrontendDescriptor {
  id: string;
  title: string;
  kind: 'client' | 'static';
  description?: string;
}

export interface ClientMicrofrontend extends MicrofrontendDescriptor {
  kind: 'client';
  mount: (container: Element) => MicrofrontendUnmount;
}

export interface StaticMicrofrontend extends MicrofrontendDescriptor {
  kind: 'static';
  render: () => string | Node;
}

export type MicrofrontendUnmount = () => void;
export type MicrofrontendEntry = ClientMicrofrontend | StaticMicrofrontend;

export interface MountedMicrofrontend {
  id: string;
  unmount: MicrofrontendUnmount;
}

export function createMicrofrontendRegistry<T extends MicrofrontendEntry>(
  entries: readonly T[]
): readonly T[] {
  const ids = new Set<string>();

  for (const entry of entries) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Invalid microfrontend id: ${entry.id}`);
    }

    if (ids.has(entry.id)) {
      throw new Error(`Duplicate microfrontend id: ${entry.id}`);
    }

    ids.add(entry.id);
  }

  return entries;
}

export function renderHostShell(
  root: Element,
  entries: readonly MicrofrontendDescriptor[]
): void {
  root.replaceChildren();

  const list = document.createElement('section');
  list.className = 'microfrontend-grid';

  for (const entry of entries) {
    const article = document.createElement('article');
    article.className = 'microfrontend-tile';
    article.dataset.microfrontendId = entry.id;

    const header = document.createElement('header');
    const heading = document.createElement('h2');
    heading.textContent = entry.title;

    const badge = document.createElement('span');
    badge.textContent = entry.kind;
    badge.className = 'microfrontend-kind';

    const mountPoint = document.createElement('div');
    mountPoint.id = microfrontendMountId(entry.id);
    mountPoint.className = 'microfrontend-mount';

    header.append(heading, badge);
    article.append(header);

    if (entry.description) {
      const description = document.createElement('p');
      description.textContent = entry.description;
      article.append(description);
    }

    article.append(mountPoint);
    list.append(article);
  }

  root.append(list);
}

export function mountMicrofrontends(
  root: ParentNode,
  entries: readonly MicrofrontendEntry[]
): MountedMicrofrontend[] {
  return entries.map((entry) => {
    const mountPoint = root.querySelector(`#${microfrontendMountId(entry.id)}`);

    if (!mountPoint) {
      throw new Error(`Missing mount point for microfrontend: ${entry.id}`);
    }

    if (entry.kind === 'static') {
      return mountStatic(entry, mountPoint);
    }

    return mountClient(entry, mountPoint);
  });
}

function mountStatic(
  entry: StaticMicrofrontend,
  mountPoint: Element
): MountedMicrofrontend {
  try {
    const rendered = entry.render();
    mountPoint.replaceChildren(
      typeof rendered === 'string' ? textFragment(rendered) : rendered
    );
  } catch (error) {
    mountPoint.replaceChildren(createMountError(entry.id, error));
    reportError(error);
  }
  return { id: entry.id, unmount: () => mountPoint.replaceChildren() };
}

function mountClient(
  entry: ClientMicrofrontend,
  mountPoint: Element
): MountedMicrofrontend {
  try {
    const unmount = entry.mount(mountPoint);
    return { id: entry.id, unmount };
  } catch (error) {
    mountPoint.replaceChildren(createMountError(entry.id, error));
    reportError(error);
    return { id: entry.id, unmount: () => mountPoint.replaceChildren() };
  }
}

export function microfrontendMountId(id: string): string {
  return `microfrontend-${id}`;
}

function textFragment(value: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.textContent = value;
  return fragment;
}

function createMountError(id: string, error: unknown): DocumentFragment {
  const div = document.createElement('div');
  div.className = 'microfrontend-error';
  div.setAttribute('role', 'alert');

  const heading = document.createElement('strong');
  heading.textContent = 'Mount failed';

  const detail = document.createElement('span');
  detail.textContent = error instanceof Error ? error.message : String(error);

  div.append(heading, detail);

  const fragment = document.createDocumentFragment();
  fragment.append(div);
  return fragment;
}

function reportError(error: unknown): void {
  if (typeof console !== 'undefined' && console.error) {
    console.error('[microfrontend-host] Mount error:', error);
  }
}
