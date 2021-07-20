import { InMemoryTransport } from '../src';
import { Subscription } from '../src/messaging/subscription';
import { Router } from '../src/router';

describe('Router', () => {
  test('should initialize', async () => {
    const id = 'r1';
    const t = new InMemoryTransport();
    await t.connect();

    const r = new Router(id, t);

    expect(r['replyTo']).toBe('$router.r1');
    expect(r['replySub']).toBeInstanceOf(Subscription);
  });
});
