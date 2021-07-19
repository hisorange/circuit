import { Circuit } from '../src';

describe('Publish Subscribe', () => {
  test('should transport the message', done => {
    const c = new Circuit();
    c.connect().then(() => {
      c.subscribe('test1', params => {
        expect(params).toBe('a');

        c.disconnect().then(() => {
          done();
        });
      });

      c.publish('test1', 'a');
    });
  }, 50);
});
