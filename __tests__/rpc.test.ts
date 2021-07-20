import { Circuit } from '../src';
import { InMemoryTransport } from '../src/transports';

interface SumRequest {
  a: number;
  b: number;
}

type SumResult = number;

describe('RPC', () => {
  describe('Single Node', () => {
    test('should respond to request', async () => {
      const c = new Circuit('r0');
      await c.connect();

      c.respond<SumRequest, SumResult>('sum', msg => {
        return msg.content.a + msg.content.b;
      });

      const r = await c.request<SumRequest, SumResult>('sum', {
        a: 1,
        b: 2,
      });

      expect(r).toBe(3);

      await c.disconnect();
    }, 50);
  });

  describe('Multi Node', () => {
    test('should respond to request', async () => {
      const t = new InMemoryTransport();

      const c1 = new Circuit('r1', t);
      await c1.connect();
      const c2 = new Circuit('r2', t);
      await c2.connect();

      await c1.respond<SumRequest, SumResult>('sum', msg => {
        return msg.content.a + msg.content.b;
      });

      const r = await c2.request<SumRequest, SumResult>('sum', {
        a: 1,
        b: 2,
      });

      expect(r).toBe(3);

      await c1.disconnect();
      await c2.disconnect();
    }, 50);
  });
});
