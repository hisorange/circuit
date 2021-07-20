import { Circuit } from '../src';
import { Subscription } from '../src/messaging/subscription';

describe('Publish Subscribe', () => {
  test('should transport the message', async () => {
    const c = new Circuit('n1');
    await c.connect();

    await c.subscribe('test1', msg => {
      expect(msg.content).toBe('a');
    });

    await c.publish('test1', 'a');
    await c.disconnect();
  }, 50);

  test('should create a subscription', async () => {
    const c = new Circuit('n1');
    await c.connect();

    jest.spyOn(c['transport'], 'subscribe');

    const h = () => {};
    const s = await c.subscribe('test', h);

    expect(s).toBeInstanceOf(Subscription);
    expect(c['transport'].subscribe).toHaveBeenCalledTimes(1);

    await c.disconnect();
  });
});
