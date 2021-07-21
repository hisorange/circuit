import { Circuit } from '../src';
import { NotFoundException } from '../src/exceptions';
import { NetworkChangeMessage } from '../src/interfaces';
import { Message } from '../src/messaging/message';
import { createTransport } from './utils';

describe('Network', () => {
  describe('Single Circuit', () => {
    test('should register channels', async () => {
      const c = new Circuit();
      await c.connect();

      jest.spyOn(c['network'], 'register');
      jest.spyOn(c, 'publish');

      await c.subscribe('a', () => {});

      expect(c['network']['register']).toHaveBeenCalledWith('a');
      expect(c['publish']).toHaveBeenCalledTimes(1);

      await c.disconnect();
    });

    test('should deregister channels', async () => {
      const c = new Circuit();
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

      // Deregister
      expect(c['network']['deregister']).toHaveBeenCalledWith(
        '$network',
        '$network.' + c.id,
        'a',
        'b',
      );

      expect(c['publish']).toHaveBeenCalledTimes(3);
    });

    test('should find local channels', async () => {
      const c = new Circuit();
      await c.connect();

      await c.subscribe('a', () => {});
      await c.subscribe('b', () => {});

      expect(c['network'].find('a')).toBe(c.id);
      expect(c['network'].find('b')).toBe(c.id);

      expect(() => c['network'].find('c')).toThrow(NotFoundException);

      await c.disconnect();
    });
  });

  describe('Change Messages', () => {
    test('should add channels', async () => {
      const c = new Circuit();
      await c.connect();
      const n = c['network'];

      await c.subscribe('c', () => {});

      const addMsg = new Message<NetworkChangeMessage>();
      addMsg.sender = 'b2';
      addMsg.recipient = c.id;
      addMsg.content = {
        action: 'add',
        channels: ['a', 'b'],
      };

      n['handleNetworkChange'](addMsg);

      expect(n.find('a')).toBe('b2');
      expect(n.find('b')).toBe('b2');
      expect(n.find('c')).toBe(c.id);

      await c.disconnect();
    });

    test('should remove channels', async () => {
      const c = new Circuit();
      await c.connect();
      const n = c['network'];

      await c.subscribe('c', () => {});

      const addMsg = new Message<NetworkChangeMessage>();
      addMsg.sender = 'b2';
      addMsg.recipient = c.id;
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
      expect(n.find('c')).toBe(c.id);

      await c.disconnect();
    });

    test('should respond to join announcement', async () => {
      const c = new Circuit();

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

      await c.disconnect();
    });
  });

  describe('Multi Circuit', () => {
    test('should find remote channels', async () => {
      const t = createTransport();
      await t.connect();

      const node1 = new Circuit('find1', t);
      const node2 = new Circuit('find2', t);

      await node1.connect();
      await node2.connect();

      await node1.subscribe('srv1', () => {});
      await node2.subscribe('srv2', () => {});

      await new Promise(wait => setTimeout(wait, 500));

      try {
        expect(node1['network'].find('srv1')).toBe('find1');
        expect(node1['network'].find('srv2')).toBe('find2');

        expect(node2['network'].find('srv1')).toBe('find1');
        expect(node2['network'].find('srv2')).toBe('find2');
      } catch (error) {
        await t.disconnect();

        throw error;
      }

      await t.disconnect();
    }, 2000);
  });

  test('should retrieve in round robin', async () => {
    const t = createTransport();
    await t.connect();

    const node1 = new Circuit('rr1', t);
    const node2 = new Circuit('rr2', t);

    await node1.connect();
    await node2.connect();

    await node1.subscribe('ag', () => {});
    await node2.subscribe('ag', () => {});

    await new Promise(wait => setTimeout(wait, 200));

    const resultM1 = [node1['network'].find('ag'), node1['network'].find('ag')];

    expect(resultM1).toContain('rr1');
    expect(resultM1).toContain('rr2');

    const resultM2 = [node2['network'].find('ag'), node2['network'].find('ag')];

    expect(resultM2).toContain('rr1');
    expect(resultM2).toContain('rr2');

    await t.disconnect();
  }, 500);
});
