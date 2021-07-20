import { Message } from '../../src/messaging/message';
import { JsonSerializer } from '../../src/serializers';

describe('Serialzier', () => {
  describe('JSON', () => {
    test('should serialize', () => {
      const o = new Message();
      o.content = { b: 'a' };

      const s = new JsonSerializer();
      const serialized = s.serialize(o);

      expect(typeof serialized).toBe('string');
    });

    test('should deserialize', () => {
      const msg = new Message<{ b: string }>();
      msg.content = { b: 'a' };

      const s = new JsonSerializer();
      const serialized = s.serialize(msg);
      const deserialized = s.deserialize<{ b: string }>(serialized);

      expect(deserialized).toHaveProperty('id');
      expect(deserialized).toHaveProperty('content');
      expect(deserialized).toHaveProperty('createdAt');

      expect(deserialized.id).toBe(msg.id);
      expect(deserialized.content.b).toBe(msg.content.b);
      expect(deserialized.createdAt).toBe(msg.createdAt);
    });
  });
});
