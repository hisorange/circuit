import {
  AlreadyConnectedException,
  NotConnectedException,
} from '../../src/exceptions';
import { Message } from '../../src/messaging/message';
import { Subscription } from '../../src/messaging/subscription';
import { InMemoryTransport } from '../../src/transports';

describe('In Memory Transport', () => {
  if (process.env.TEST_TRANSPORT) {
    test = test.skip;
  }

  describe('Connection', () => {
    test('should connect', async () => {
      const t = new InMemoryTransport();

      expect(t.isConnected()).toBe(false);
      await t.connect();
      expect(t.isConnected()).toBe(true);

      await t.disconnect();
    });

    test('should disconnect', async () => {
      const t = new InMemoryTransport();

      await t.connect();
      expect(t.isConnected()).toBe(true);
      await t.disconnect();
      expect(t.isConnected()).toBe(false);
    });

    test('should indicate connection state', async () => {
      const t = new InMemoryTransport();

      expect(t.isConnected()).toBe(false);
      await t.connect();
      expect(t.isConnected()).toBe(true);
      await t.disconnect();
    });

    test('should throw on existing connection', async () => {
      const t = new InMemoryTransport();
      await t.connect();

      expect(() => t.connect()).rejects.toThrow(AlreadyConnectedException);

      await t.disconnect();
    });

    test('should throw on non existing connection', async () => {
      const t = new InMemoryTransport();

      expect(() => t.disconnect()).rejects.toThrow(NotConnectedException);
    });
  });

  describe('Memory Management', () => {
    test('should clear references on disconnect', async () => {
      const t = new InMemoryTransport();
      await t.connect();

      t.publish('test1', new Message());
      t.subscribe('test2', new Subscription(() => {}));

      await t.disconnect();
      expect(t['queues'].size).toBe(0);
      expect(t['subscribers'].size).toBe(0);
      expect(t['connection']).toBeFalsy();
    });
  });

  describe('Message Processing', () => {
    test('should throw when publish is not connected', async () => {
      const t = new InMemoryTransport();

      expect(() => t.publish('a', new Message())).rejects.toThrow(
        NotConnectedException,
      );
    });

    test('should throw when subscribe is not connected', async () => {
      const t = new InMemoryTransport();

      expect(() =>
        t.subscribe('a', new Subscription(() => {})),
      ).rejects.toThrow(NotConnectedException);
    });

    test('should dispatch message to multiple subscribers', async () => {
      const t = new InMemoryTransport();
      await t.connect();

      const msg_1 = new Message();
      msg_1.content = 'a';

      await t.subscribe(
        'c1',
        new Subscription(msg => {
          expect(msg).toBe(msg_1);
        }),
      );

      await t.subscribe(
        'c1',
        new Subscription(msg => {
          expect(msg).toBe(msg_1);
        }),
      );

      await t.publish('c1', msg_1);

      // To not to have messages in queue.
      expect(t['queues'].size).toBe(0);
      // To have the 2 subscriber
      expect(t['subscribers'].get('c1').length).toBe(2);

      await t.disconnect();
    });

    test('should dispatch message for new subscriber', async () => {
      const t = new InMemoryTransport();
      await t.connect();

      const msg_1 = new Message();
      msg_1.content = 'a';

      await t.publish('c1', msg_1);

      await t.subscribe(
        'c1',
        new Subscription(msg => {
          expect(msg).toBe(msg_1);
        }),
      );

      // To not to have messages in queue.
      expect(t['queues'].size).toBe(0);

      await t.disconnect();
    });

    test('should not dispatch message to wrong channel', async () => {
      const t = new InMemoryTransport();
      await t.connect();

      const msg_1 = new Message();
      msg_1.content = 'a';

      await t.publish('c2', msg_1);
      await t.subscribe('c1', new Subscription(msg => {}));

      expect(t['queues'].size).toBe(1);
      expect(t['queues'].get('c2').length).toBe(1);

      await t.disconnect();
    });
  });
});
