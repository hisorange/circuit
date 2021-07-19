import { ISubscribeHandler, ISubscription, ITransport } from './interfaces';
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
  async request(channel: string, message: any) {}
  async respond(channel: string, handler: any) {}

  // Pub Sub
  async publish(channel: string, message: any) {
    this.transport.publish(`ps.${channel}`, message);
  }

  async subscribe(
    channel: string,
    handler: ISubscribeHandler,
  ): Promise<ISubscription> {
    const subscription = new Subscription(handler);

    this.transport.subscribe(`ps.${channel}`, subscription);

    return subscription;
  }
}
