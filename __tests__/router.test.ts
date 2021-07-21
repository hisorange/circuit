import { InMemoryTransport, TimeoutException } from '../src';
import { Message } from '../src/messaging/message';
import { Subscription } from '../src/messaging/subscription';
import { Router } from '../src/router';

describe('Router', () => {
  test('should initialize', async () => {
    const id = 'r1';
    const t = new InMemoryTransport();
    await t.connect();

    const r = new Router(id, t);

    expect(r['replyTo']).toBe('$router.' + id);
    expect(r['replySub']).toBeInstanceOf(Subscription);

    await t.disconnect();
  });

  test('should create a reply channel and subscribe to it', async () => {
    const t = new InMemoryTransport();
    await t.connect();
    jest.spyOn(t, 'subscribe');

    const r = new Router('r1', t);

    expect(t.subscribe).toHaveBeenCalledWith(
      expect.stringMatching(/\$router\.r1/),
      expect.any(Subscription),
    );

    await t.disconnect();
    r.disconnect();
  });

  test('should package the request and handle timeout', async () => {
    jest.useFakeTimers();

    const t = new InMemoryTransport();
    await t.connect();
    const r = new Router('r1', t);

    jest.spyOn(t, 'publish');

    const req = new Message();
    req.recipient = 'r2';
    req.channel = 'sum';

    const m = r.doRequest(req, 50_000);
    expect(m).rejects.toThrow(TimeoutException);

    expect(t.publish).toHaveBeenCalledWith('r2.sum', req);

    expect(req.replyTo).toBe('$router.r1');
    expect(req.timeToLive).toBe(50_000);

    jest.advanceTimersByTime(50_000);

    await t.disconnect();
    r.disconnect();
  });
});
