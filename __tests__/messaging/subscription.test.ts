import { Subscription } from '../../src/messaging/subscription';

describe('Subscription', () => {
  test('should generate a unique ID', () => {
    const subscription_1 = new Subscription(() => {});
    expect(subscription_1.id).toMatch(/^[a-f0-9-]+$/);

    const subscription_2 = new Subscription(() => {});
    expect(subscription_2.id).toMatch(/^[a-f0-9-]+$/);

    expect(subscription_1.id).not.toBe(subscription_2.id);
  });

  test('should allow to access the handler', () => {
    const handler = () => {};
    const subscription = new Subscription(handler);

    expect(subscription.handler).toBe(handler);
  });
});
