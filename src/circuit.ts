import {
  IRequestHandler,
  ISubscribeHandler,
  ISubscription,
  ITransport,
} from './interfaces';
import { Message } from './messaging/message';
import { Subscription } from './messaging/subscription';
import { Network } from './network';
import { InMemoryTransport } from './transports';
import UUID = require('uuid');

type MessageContent = string | number | Object | boolean;

export class Circuit {
  protected network: Network;
  protected subscriptions = new Map<string, ISubscription[]>();

  constructor(readonly id?: string, protected transport?: ITransport) {
    if (!this.id) {
      this.id = UUID.v4();
    }

    if (!this.transport) {
      this.transport = new InMemoryTransport();
    }
  }

  async connect() {
    if (!this.transport.isConnected()) {
      await this.transport.connect();
    }

    this.network = new Network();
    this.network.bind(this);
  }

  async disconnect() {
    // Disconnect the transport.
    if (this.transport.isConnected()) {
      // Annonunce the remove, so the network will forget about us.
      await this.network.deregister(...Array.from(this.subscriptions.keys()));

      await this.transport.disconnect();
    }
  }

  // RPC
  async request<I = any, O = any>(channel: string, content: I): Promise<O> {
    const request = new Message<I>();
    request.sender = this.id;
    request.channel = channel;
    request.recipient = this.network.find(channel);
    request.replyTo = `reply.${this.id}`;
    request.content = content;

    return this.createResponseHandler<I, O>(request);
  }

  /**
   * @description Wrap the response handling logic.
   */
  protected createResponseHandler<I, O>(request: Message<I>): Promise<O> {
    return new Promise<O>(onResponse => {
      // Subscribe to the reply channel.
      this.subscribe(request.replyTo, (response: Message<O>) =>
        onResponse(response.content),
      );

      // Send it to the known recipient.
      this.transport.publish(
        request.recipient + '.' + request.channel,
        request,
      );
    });
  }

  async respond<I = any, O = any>(
    channel: string,
    handler: IRequestHandler<I, O>,
  ): Promise<ISubscription> {
    // A single channel associated to this node's execution for this job.
    const directChannel = this.id + '.' + channel;

    await this.network.register(channel);

    return await this.subscribe(
      directChannel,
      this.createRequestHandler(handler),
    );
  }

  /**
   * @description Wrap a request handler into a request execution and response handler logic.
   */
  protected createRequestHandler<I, O>(
    handler: IRequestHandler<I, O>,
  ): IRequestHandler<I, void> {
    return async request => {
      const result = await handler(request);
      const response = new Message();
      response.sender = this.id;
      response.channel = request.replyTo;
      response.recipient = request.sender;
      response.content = result;

      this.transport.publish(request.replyTo, response);
    };
  }

  /**
   * @description Publish a message every listener on the channel.
   */
  async publish(channel: string, content: MessageContent | Message) {
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
  async subscribe<I = any>(
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
