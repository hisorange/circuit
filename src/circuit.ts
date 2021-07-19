import {
  IRequestHandler,
  ISubscribeHandler,
  ISubscription,
  ITransport,
} from './interfaces';
import { Message } from './message';
import { Network } from './network';
import { Subscription } from './subscription';
import { InMemoryTransport } from './transports';
import UUID = require('uuid');

export class Circuit {
  protected network: Network;

  constructor(protected id?: string, protected transport?: ITransport) {
    if (!this.id) {
      this.id = UUID.v4();
    }

    if (!this.transport) {
      this.transport = new InMemoryTransport();
    }

    //this.network = new Network(this.transport, this.id);
  }

  async connect() {
    await this.transport.connect();
  }

  async disconnect() {
    await this.transport.disconnect();
  }

  // RPC
  async request<I = any, O = any>(channel: string, content: I): Promise<O> {
    const request = new Message<I>();
    request.sender = this.id;
    request.channel = channel;
    request.recipient = this.network.findListener(channel);
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
    const nodeChannel = this.id + '.' + channel;

    return await this.subscribe(
      nodeChannel,
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
  async publish(channel: string, content: string | number | Object | boolean) {
    const msg = new Message();
    msg.sender = this.id;
    msg.channel = channel;
    msg.content = content;

    return this.transport.publish(channel, msg);
  }

  /**
   * @description Subscribe to a channel which actuates the given handler on receive.
   */
  async subscribe(
    channel: string,
    handler: ISubscribeHandler,
  ): Promise<ISubscription> {
    const subscription = new Subscription(handler);
    this.transport.subscribe(channel, subscription);

    return subscription;
  }
}
