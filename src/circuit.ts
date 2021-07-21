import {
  IRequestHandler,
  ISubscribeHandler,
  ISubscription,
  ITransport,
} from './interfaces';
import { Message } from './messaging/message';
import { Subscription } from './messaging/subscription';
import { Network } from './network';
import { Router } from './router';
import { InMemoryTransport } from './transports';
import UUID = require('uuid');

type MessageContent = string | number | unknown | boolean;

export class Circuit {
  protected network: Network;
  protected router: Router;
  protected subscriptions = new Map<string, ISubscription[]>();

  constructor(readonly id?: string, protected transport?: ITransport) {
    if (!this.id) {
      this.id = UUID.v4();
    }

    if (!this.transport) {
      this.transport = new InMemoryTransport();
    }
  }

  async connect(): Promise<void> {
    if (!this.transport.isConnected()) {
      await this.transport.connect();
    }

    this.network = new Network();
    this.network.bind(this);
    this.router = new Router(this.id, this.transport);
  }

  async disconnect(): Promise<void> {
    this.router.disconnect();

    // Disconnect the transport.
    if (this.transport.isConnected()) {
      // Announce the remove, so the network will forget about us.
      await this.network.deregister(...Array.from(this.subscriptions.keys()));

      await this.transport.disconnect();
    }
  }

  /**
   * @description Request the execution of a registered action.
   */
  async request<I = unknown, O = unknown>(
    channel: string,
    content: I,
  ): Promise<O> {
    const request = new Message<I>();
    request.sender = this.id;
    request.channel = channel;
    request.recipient = this.network.find(channel);
    request.content = content;

    return (await this.router.doRequest<I, O>(request)).content;
  }

  async respond<I = unknown, O = unknown>(
    channel: string,
    handler: IRequestHandler<I, O>,
  ): Promise<ISubscription> {
    // Register the action "sum" to this circuit.
    await this.network.register(channel);

    // A single channel associated to this node's execution for this job.
    const directChannel = this.id + '.' + channel;

    return await this.subscribe(directChannel, this.router.doRespond(handler));
  }

  /**
   * @description Publish a message every listener on the channel.
   */
  async publish(
    channel: string,
    content: MessageContent | Message,
  ): Promise<void> {
    let msg: Message;

    if (content instanceof Message) {
      msg = content;
    } else {
      msg = new Message();
      msg.content = content;
    }

    msg.channel = channel;
    msg.sender = this.id;

    return this.transport.publish(channel, msg);
  }

  /**
   * @description Subscribe to a channel which actuates the given handler on receive.
   */
  async subscribe<I = unknown>(
    channel: string,
    handler: ISubscribeHandler<I>,
  ): Promise<ISubscription> {
    const subscription = new Subscription(handler);
    this.transport.subscribe(channel, subscription);

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }

    this.subscriptions.get(channel).push(subscription);
    await this.network.register(channel);

    return subscription;
  }
}
