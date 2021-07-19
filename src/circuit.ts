import {
  IRequestHandler,
  ISubscribeHandler,
  ISubscription,
  ITransport,
} from './interfaces';
import { Message } from './message';
import { Subscription } from './subscription';
import { InMemoryTransport } from './transports';
import UUID = require('uuid');

export class Circuit {
  constructor(protected id?: string, protected transport?: ITransport) {
    if (!this.id) {
      this.id = UUID.v4();
    }

    if (!this.transport) {
      this.transport = new InMemoryTransport();
    }
  }

  async connect() {
    await this.transport.connect();
  }

  async disconnect() {
    await this.transport.disconnect();
  }

  // RPC
  async request<I = any, O = any>(channel: string, params: I) {
    const msg = new Message<I>(params);
    const rpcChannel = this.createRpcChannelName(channel);

    msg.channel = rpcChannel;
    msg.replyChannel = `reply.${this.id}.${msg.id}`;

    return new Promise<O>(reply => {
      const resHandler = (result: Message<O>) => {
        reply(result.params);
      };
      const resSub = new Subscription(resHandler);
      this.transport.subscribe(msg.replyChannel, resSub);

      this.transport.publish(rpcChannel, msg);
    });
  }

  async respond<I = any, O = any>(
    channel: string,
    handler: IRequestHandler<I, O>,
  ): Promise<ISubscription> {
    const responseHandler: IRequestHandler<I, O> = async requestMessage => {
      const responseParams = await handler(requestMessage);
      const responseMessage = new Message(responseParams);
      responseMessage.channel = requestMessage.replyChannel;

      this.transport.publish(responseMessage.channel, responseMessage);
      return responseParams;
    };

    const subscription = new Subscription(responseHandler);
    const rpcChannel = this.createRpcChannelName(channel);

    this.transport.subscribe(rpcChannel, subscription);

    return subscription;
  }

  // Pub Sub
  async publish(channel: string, params: string | number | Object | boolean) {
    const psChannel = this.createPubSubChannelName(channel);
    const msg = new Message(params);
    msg.channel = channel;

    this.transport.publish(psChannel, msg);
  }

  async subscribe(
    channel: string,
    handler: ISubscribeHandler,
  ): Promise<ISubscription> {
    const subscription = new Subscription(handler);
    const psChannel = this.createPubSubChannelName(channel);

    this.transport.subscribe(psChannel, subscription);

    return subscription;
  }

  protected createPubSubChannelName(channel: string) {
    return `pub-sub.${channel}`;
  }

  protected createRpcChannelName(channel: string) {
    return `rpc.${channel}.${this.id}`;
  }
}
