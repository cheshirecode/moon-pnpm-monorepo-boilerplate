import { describe, expect, it } from 'vitest';
import { serializeBootstrap, parseBootstrap } from './bootstrap';

describe('bootstrap serialization', () => {
  it('escapes < so </script> cannot close the script element', () => {
    const serialized = serializeBootstrap({ html: '</script>' });
    // The security property: the literal string </script> must never appear
    expect(serialized).not.toContain('</script>');
    // Verify the < was escaped (output contains the escape representation)
    expect(serialized).toMatch(/\\u003c\/script>/);
  });

  it('round-trips < and & without breaking JSON', () => {
    const payload = { a: '<', b: '&', c: '</script>' };
    const serialized = serializeBootstrap(payload);
    const element = { textContent: serialized } as unknown as Element;
    expect(parseBootstrap(element)).toEqual(payload);
  });

  it('round-trips U+2028 and U+2029', () => {
    const payload = { u2028: '\u2028', u2029: '\u2029' };
    const serialized = serializeBootstrap(payload);
    const element = { textContent: serialized } as unknown as Element;
    expect(parseBootstrap(element)).toEqual(payload);
  });
});