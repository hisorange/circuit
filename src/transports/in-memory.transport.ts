import {
  AlreadyConnectedException,
  NotConnectedException,
} from '../exceptions';
import { ISubscription, ITransport } from '../interfaces';
import { Message } from '../messaging/message';

/**
 * Simple in memory transport, used for testing and can be useful when developing applications
 * which will be connected to a real message queue in the future but until then a simple instance
 * can manage the workload.
 *
 * The transport tries to act more like a real queue, keeps the messages in an array queue and not just
 * pushing to currently active subscribers, this allows us to enqueue messages and register subscribers
 * later, just like in RabbitMQ and others.
 */
export class InMemoryTransport implements ITransport {
  /**
   * @description Local interval used to process queues more like a remote server would.
   */
  protected connection: boolean = false;

  /**
   * @description Store messages grouped by channels.
   */
  protected queues: Map<string, Message[]>;

  /**
   * @description Registered subscriptions grouped by channels.
   */
  protected subscribers: Map<string, ISubscription[]>;

  isConnected() {
    return this.connection;
  }

  async connect() {
    if (this.isConnected()) {
      throw new AlreadyConnectedException();
    }

    // Create collectors
    this.clearMessageQueues();
    this.clearSubscribers();

    this.connection = true;
  }

  async disconnect() {
    if (!this.isConnected()) {
      throw new NotConnectedException();
    }

    this.connection = false;

    // Clear leftovers
    this.clearMessageQueues();
    this.clearSubscribers();
  }

  async publish(channel: string, message: Message): Promise<void> {
    if (!this.isConnected()) {
      throw new NotConnectedException();
    }

    // Upsert the channel group
    if (!this.queues.has(channel)) {
      this.queues.set(channel, []);
    }

    this.queues.get(channel).push(message);

    // Change detected, process the existing message queues.
    this.processQueues();
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

    // Change detected, process the existing message queues.
    this.processQueues();
  }

  /**
   * @description Clear the message queue reference.
   */
  protected clearMessageQueues() {
    this.queues = new Map<string, Message[]>();
  }

  /**
   * @description Clear the message queue reference.
   */
  protected clearSubscribers() {
    this.subscribers = new Map<string, ISubscription[]>();
  }

  /**
   * @description Process the queued messages and dispatch to the subscribers.
   */
  protected processQueues() {
    // Fetch the active message queues
    for (const [channel, queue] of this.queues.entries()) {
      // Check for active subscriptions
      if (this.subscribers.has(channel)) {
        const subscribers = this.subscribers.get(channel);

        for (const subscriber of subscribers) {
          for (const message of queue) {
            subscriber.handler(message);
          }
        }

        // Channel is cleared.
        this.queues.delete(channel);
      }
    }
  }
}
