import { Circuit } from '../src';
import { Subscription } from '../src/subscription';

describe('Publish Subscribe', () => {
  test('should transport the message', done => {
    const c = new Circuit('n1');
    c.connect().then(() => {
      c.subscribe('test1', params => {
        expect(params.params).toBe('a');

        c.disconnect().then(() => {
          done();
        });
      });

      c.publish('test1', 'a');
    });
  }, 50);

  test('should create a subscription', async () => {
    const c = new Circuit('n1');

    jest.spyOn(c['transport'], 'subscribe');

    const h = () => {};
    const s = await c.subscribe('test', h);

    expect(s).toBeInstanceOf(Subscription);
    expect(c['transport'].subscribe).toHaveBeenCalledTimes(1);
  });
});
