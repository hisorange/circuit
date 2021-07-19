import { Circuit } from '../src';

interface SumRequest {
  a: number;
  b: number;
}

type SumResult = number;

describe('RPC', () => {
  test('should respond to request', async () => {
    const c = new Circuit('r1');
    await c.connect();

    c.respond<SumRequest, SumResult>('sum', msg => {
      return msg.params.a + msg.params.b;
    });

    const r = await c.request<SumRequest, SumResult>('sum', {
      a: 1,
      b: 2,
    });

    expect(r).toBe(3);

    await c.disconnect();
  }, 50);
});
