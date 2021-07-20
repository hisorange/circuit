import { Message } from '../../src/messaging/message';

describe('Message', () => {
  test('should init a created time', () => {
    const msg = new Message();

    expect(msg.createdAt).toBeLessThanOrEqual(Date.now());
  });
});
