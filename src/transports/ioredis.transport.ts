import {
  AlreadyConnectedException,
  NotConnectedException,
} from '../exceptions';
import { ISubscription, ITransport } from '../interfaces';
import { Message } from '../messaging/message';
import Redis = require('ioredis');

/**
 * IO Redis transport
 */
export class IoRedisTransport implements ITransport {
  /**
   * @description Local interval used to process queues more like a remote server would.
   */
  protected pubCon: Redis.Redis | null = null;
  protected subCon: Redis.Redis | null = null;

  /**
   * @description Registered subscriptions grouped by channels.
   */
  protected subscribers = new Map<string, ISubscription[]>();

  constructor(protected config: Redis.RedisOptions = undefined) {}

  isConnected() {
    return !!this.pubCon;
  }

  async connect() {
    if (this.isConnected()) {
      throw new AlreadyConnectedException();
    }

    this.pubCon = new Redis(this.config);
    this.subCon = new Redis(this.config);

    if (this.pubCon.status === 'connecting') {
      await new Promise(ok => this.pubCon.once('connect', ok));
    }

    if (this.subCon.status === 'connecting') {
      await new Promise(ok => this.subCon.once('connect', ok));
    }

    // Handle the
    this.subCon.on('message', this.subscribeRouter.bind(this));
  }

  async disconnect() {
    if (!this.isConnected()) {
      throw new NotConnectedException();
    }

    this.subCon.off('message', this.subscribeRouter.bind(this));
    if (this.subCon.status !== 'close') {
      this.subCon.disconnect();
    }
    this.subCon = null;

    if (this.pubCon.status !== 'close') {
      this.pubCon.disconnect();
    }
    this.pubCon = null;

    // Clear leftovers
    this.clearSubscribers();
  }

  async publish(channel: string, message: Message): Promise<void> {
    if (!this.isConnected()) {
      throw new NotConnectedException();
    }

    await this.pubCon.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, subscriber: ISubscription): Promise<void> {
    if (!this.isConnected()) {
      throw new NotConnectedException();
    }

    // Upsert the channel group
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }

    this.subscribers.get(channel).push(subscriber);
    await this.subCon.subscribe(channel);
  }

  protected async subscribeRouter(channel: string, messageString: string) {
    const messageRaw: Message = JSON.parse(messageString);
    const message = new Message();

    for (const key in messageRaw) {
      if (Object.prototype.hasOwnProperty.call(messageRaw, key)) {
        message[key] = messageRaw[key];
      }
    }

    // Check for active subscriptions
    if (this.subscribers.has(channel)) {
      const subscribers = this.subscribers.get(channel);

      for (const subscriber of subscribers) {
        await subscriber.handler(message);
      }
    }
  }

  /**
   * @description Clear the message queue references.
   */
  protected clearSubscribers() {
    this.subscribers = new Map<string, ISubscription[]>();
  }
}
