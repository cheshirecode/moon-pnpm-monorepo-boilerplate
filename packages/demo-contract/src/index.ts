import {
  buildQueryUrl,
  createUrlSearchParams,
  toHyphen,
  validateEmail,
  validateRequired
} from '@cheshirecode/browser-utils';

export interface RendererDemoContract {
  renderer: string;
  title: string;
  slug: string;
  emailValidation: string;
  requiredValidation: string;
  query: string;
  url: string;
}

export function createRendererDemoContract(renderer: string): RendererDemoContract {
  const title = `${renderer} renderer`;
  const slug = slugifyRendererTitle(title);
  const params = createUrlSearchParams('', {
    renderer: slug,
    contract: 'shared'
  });

  return {
    renderer,
    title,
    slug,
    emailValidation: validateEmail('demo@example.test') ?? 'valid',
    requiredValidation: validateRequired('demo', 'Demo') ?? 'valid',
    query: params.toString(),
    url: buildQueryUrl('https://example.test/demo', params.entriesAsObj())
  };
}

export function formatRendererDemo(contract: RendererDemoContract): string {
  return `${contract.title} :: ${contract.slug} :: ${contract.emailValidation} :: ${contract.requiredValidation}`;
}

function slugifyRendererTitle(value: string): string {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .split(/\s+/)
    .map((part) => toHyphen(part))
    .join('-')
    .toLowerCase();
}
