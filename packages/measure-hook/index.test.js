import { expect, it } from 'vitest';
import measure from './';

it('measure directly', async () => {
  await Promise.all(
    [1, 1000, 500].map(async (milliseconds) => {
      const m = measure();
      await new Promise((resolve) => {
        const wait = setTimeout(() => {
          clearTimeout(wait);
          resolve();
        }, milliseconds);

        return wait;
      });
      expect(
        m() > milliseconds - 1,
        `something that takes ${milliseconds} milliseconds`
      ).toBeTruthy();
    })
  );
});

it('measure with callback', async () => {
  let c = 1;
  const mWithCb = measure(250, (timing, s) => {
    s += 1;
    expect(s, `new value was ${c}, should be ${c + 1}`).toBe(c + 1);
  });

  await new Promise((resolve) => {
    setTimeout(() => {
      mWithCb(c);
      resolve();
    }, 200);
  });
});
