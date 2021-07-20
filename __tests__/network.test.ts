import { Circuit } from '../src';
import { NotFoundException } from '../src/exceptions';
import { NetworkChangeMessage } from '../src/interfaces';
import { Message } from '../src/messaging/message';
import { InMemoryTransport } from '../src/transports';

describe('Network', () => {
  describe('Single Circuit', () => {
    test('should register channels', async () => {
      const c = new Circuit('c1');
      await c.connect();

      jest.spyOn(c['network'], 'register');
      jest.spyOn(c, 'publish');

      await c.subscribe('a', () => {});

      expect(c['network']['register']).toHaveBeenCalledWith('a');
      expect(c['publish']).toHaveBeenCalledTimes(1);

      await c.disconnect();
    });

    test('should deregister channels', async () => {
      const c = new Circuit('c1');
      await c.connect();

      jest.spyOn(c['network'], 'register');
      jest.spyOn(c['network'], 'deregister');
      jest.spyOn(c, 'publish');

      await c.subscribe('a', () => {});
      await c.subscribe('b', () => {});

      expect(c['publish']).toHaveBeenCalledTimes(2);

      await c.disconnect();

      // Registering
      expect(c['network']['register']).toHaveBeenNthCalledWith(1, 'a');
      expect(c['network']['register']).toHaveBeenNthCalledWith(2, 'b');

      // Deregistering
      expect(c['network']['deregister']).toHaveBeenCalledWith(
        '$network',
        '$network.c1',
        'a',
        'b',
      );

      expect(c['publish']).toHaveBeenCalledTimes(3);
    });

    test('should find local channels', async () => {
      const c = new Circuit('c1');
      await c.connect();

      await c.subscribe('a', () => {});
      await c.subscribe('b', () => {});

      expect(c['network'].find('a')).toBe('c1');
      expect(c['network'].find('b')).toBe('c1');

      expect(() => c['network'].find('c')).toThrow(NotFoundException);
    });
  });

  describe('Change Messages', () => {
    test('should add channels', async () => {
      const c = new Circuit('b1');
      await c.connect();
      const n = c['network'];

      await c.subscribe('c', () => {});

      const addMsg = new Message<NetworkChangeMessage>();
      addMsg.sender = 'b2';
      addMsg.recipient = 'b1';
      addMsg.content = {
        action: 'add',
        channels: ['a', 'b'],
      };

      n['handleNetworkChange'](addMsg);

      expect(n.find('a')).toBe('b2');
      expect(n.find('b')).toBe('b2');
      expect(n.find('c')).toBe('b1');
    });

    test('should remove channels', async () => {
      const c = new Circuit('b1');
      await c.connect();
      const n = c['network'];

      await c.subscribe('c', () => {});

      const addMsg = new Message<NetworkChangeMessage>();
      addMsg.sender = 'b2';
      addMsg.recipient = 'b1';
      addMsg.content = {
        action: 'add',
        channels: ['a', 'b'],
      };

      n['handleNetworkChange'](addMsg);

      const removeMsg = new Message<NetworkChangeMessage>();
      removeMsg.sender = 'b2';
      removeMsg.content = {
        action: 'remove',
        channels: ['a'],
      };

      n['handleNetworkChange'](removeMsg);

      expect(() => n.find('a')).toThrow(NotFoundException);
      expect(n.find('b')).toBe('b2');
      expect(n.find('c')).toBe('b1');
    });

    test('should respond to join annonuncment', async () => {
      const c = new Circuit('b1');

      const publish = jest.spyOn(c, 'publish');

      await c.connect();
      const n = c['network'];

      expect(publish).toHaveBeenCalledWith(
        '$network',
        expect.objectContaining({
          content: expect.objectContaining({
            action: expect.stringMatching('join'),
          }),
        }),
      );

      await c.subscribe('a', () => {});

      expect(publish).toHaveBeenCalledWith(
        '$network',
        expect.objectContaining({
          content: expect.objectContaining({
            action: expect.stringMatching('add'),
            channels: expect.arrayContaining(['a']),
          }),
        }),
      );

      await c.subscribe('b', () => {});

      expect(publish).toHaveBeenCalledWith(
        '$network',
        expect.objectContaining({
          content: expect.objectContaining({
            action: expect.stringMatching('add'),
            channels: expect.arrayContaining(['b']),
          }),
        }),
      );

      const joinMsg = new Message<NetworkChangeMessage>();
      joinMsg.sender = 'b2';
      joinMsg.content = {
        action: 'join',
        channels: [],
      };

      n['handleNetworkChange'](joinMsg);

      expect(publish).toHaveBeenCalledWith(
        '$network.b2',
        expect.objectContaining({
          content: expect.objectContaining({
            action: expect.stringMatching('add'),
            channels: expect.arrayContaining(['a', 'b']),
          }),
        }),
      );
    });
  });

  describe('Multi Circuit', () => {
    test('should find remote channels', async () => {
      const t = new InMemoryTransport();

      const m1 = new Circuit('m1', t);
      const m2 = new Circuit('m2', t);
      await m1.connect();
      await m1.subscribe('a', () => {});
      await m2.connect();

      await m2.subscribe('b', () => {});

      // Local
      expect(m1['network'].find('a')).toBe('m1');
      expect(m2['network'].find('b')).toBe('m2');

      expect(m2['network'].find('a')).toBe('m1');
      //expect(m2['network'].find('b')).toBe('m2');
    });
  });

  test('should retrive in round robin', async () => {
    const t = new InMemoryTransport();

    const m1 = new Circuit('m1', t);
    const m2 = new Circuit('m2', t);
    await m1.connect();
    await m2.connect();
    await m1.subscribe('a', () => {});
    await m2.subscribe('a', () => {});

    expect(m1['network'].find('a')).toBe('m1');
    expect(m1['network'].find('a')).toBe('m2');
    expect(m2['network'].find('a')).toBe('m1');
    expect(m2['network'].find('a')).toBe('m2');
  });
});
