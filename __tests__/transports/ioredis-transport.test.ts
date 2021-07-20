import { Circuit } from '../../src';
import { Message } from '../../src/messaging/message';
import { Subscription } from '../../src/messaging/subscription';
import { IoRedisTransport } from '../../src/transports';

describe('IO Redis Transport', () => {
  if (process.env.TEST_TRANSPORT !== 'ioredis') {
    test = test.skip;
  }

  test('should deserialize the message', async () => {
    const t = new IoRedisTransport();

    await t.connect();
    const sent = new Message<{ b: number }>();
    sent.content = {
      b: 1,
    };

    const handler = (rec: Message<{ b: number }>) => {
      expect(rec).toBeInstanceOf(Message);
      expect(rec.id).toBe(sent.id);
      expect(rec.content).toHaveProperty('b');
      expect(rec.content.b).toBe(1);
      expect(rec.createdAt).toBe(sent.createdAt);
    };
    const sub = new Subscription(handler);

    t.subscribe('t', sub);

    t.publish('t', sent);

    await t.disconnect();
  }, 200);

  test('should handle pub/sub', async () => {
    const t1 = new IoRedisTransport();
    const t2 = new IoRedisTransport();

    const c1 = new Circuit('c1', t1);
    await c1.connect();
    const c2 = new Circuit('c2', t2);
    await c2.connect();

    c1.subscribe('test', async (msg: Message) => {
      expect(msg.content).toBe('testMsg');

      await c1.disconnect();
      await c2.disconnect();
    });

    c2.publish('test', 'testMsg');
  }, 200);
});
