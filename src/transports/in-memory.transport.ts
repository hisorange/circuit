import { ISubscription, ITransport } from '../interfaces';

export class InMemoryTransport implements ITransport {
  protected queues = new Map<string, any[]>();
  protected connection: NodeJS.Timer;
  protected subscribers = new Map<string, ISubscription[]>();

  constructor() {}

  async connect() {
    this.connection = setInterval(this.process.bind(this), 1);
  }

  async disconnect() {
    if (this.connection) {
      clearInterval(this.connection);
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    if (!this.queues.has(channel)) {
      this.queues.set(channel, []);
    }

    this.queues.get(channel).push(message);
  }

  async subscribe(channel: string, subscriber: ISubscription): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }

    this.subscribers.get(channel).push(subscriber);
  }

  protected process() {
    for (const [channel, messages] of this.queues.entries()) {
      if (this.subscribers.has(channel)) {
        const subscribers = this.subscribers.get(channel);

        for (const subscriber of subscribers) {
          for (const message of messages) {
            subscriber.handler(message);
          }
        }
      }
    }
  }
}
