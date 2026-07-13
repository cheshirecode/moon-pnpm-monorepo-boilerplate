export function serializeBootstrap(payload: unknown): string {
  const json = JSON.stringify(payload);
  return json.replace(/</g, '\\u003c');
}

export function parseBootstrap(element: Element): unknown {
  const text = element.textContent ?? '';
  return JSON.parse(text);
}