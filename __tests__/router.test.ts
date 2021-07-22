import { Circuit, TimeoutException } from '../src';
import { Message } from '../src/messaging/message';
import { Subscription } from '../src/messaging/subscription';
import { Router } from '../src/router';
import { createTransport } from './utils';

describe('Router', () => {
  test('should initialize', async () => {
    const id = 'node1';
    const t = createTransport();
    await t.connect();

    const r = new Router(id, t);

    expect(r['replyTo']).toBe('$router.' + id);
    expect(r['replySub']).toBeInstanceOf(Subscription);

    await t.disconnect();
    r.disconnect();
  });

  test('should create a reply channel and subscribe to it', async () => {
    const t = createTransport();
    await t.connect();
    jest.spyOn(t, 'subscribe');

    const r = new Router('node1', t);

    expect(t.subscribe).toHaveBeenCalledWith(
      expect.stringMatching(/\$router\.node1/),
      expect.any(Subscription),
    );

    await t.disconnect();
    r.disconnect();
  });

  test('should package the request and handle timeout', async () => {
    const t = createTransport();
    await t.connect();
    const r = new Router('r1', t);

    jest.spyOn(t, 'publish');

    const req = new Message();
    req.recipient = 'r2';
    req.channel = 'sum';

    const m = r.createRequestHandler(req, 50);
    expect(m).rejects.toThrow(TimeoutException);

    expect(t.publish).toHaveBeenCalledWith('r2.sum', req);

    expect(req.replyTo).toBe('$router.r1');
    expect(req.timeToLive).toBe(50);

    // Fake timers somehow confuses the redis client?
    new Promise(wait => setTimeout(wait, 60));

    r.disconnect();
    await t.disconnect();
  }, 2000);

  test('should handle concurrency', async () => {
    const t = createTransport();
    await t.connect();
    const c = new Circuit(undefined, t);
    await c.connect();

    let resolved = 0;
    const delayers = [];

    // Handle slow requests
    await c.respond(
      'wait1s',
      () => new Promise(ok => delayers.push(() => ok(++resolved))),
      {
        concurrency: 5,
      },
    );

    const requests: Promise<number>[] = [];

    for (let i = 0; i < 15; i++) {
      requests.push(c.request<number, number>('wait1s', i));
    }

    delayers.forEach(d => d());
    expect(resolved).toBe(5);
    delayers.forEach(d => d());
    expect(resolved).toBe(10);
    delayers.forEach(d => d());
    expect(resolved).toBe(15);

    await c.disconnect();
  }, 1000);

  test('should apply the TTL to the request', async () => {
    const t = createTransport();
    await t.connect();
    const c = new Circuit(undefined, t);
    await c.connect();

    await c.respond('never', () => new Promise(() => {}));

    const req = c.request<number, number>('never', 1, {
      ttl: 15,
    });

    expect(req).rejects.toBe(TimeoutException);

    await c.disconnect();
  }, 1000);
});
