import { ITransport } from './interfaces';
import { Message } from './message';
import { Subscription } from './subscription';

interface Update {
  node: string;
  channel: string;
}

export class Network {
  protected listeners = new Map<string, Set<string>>();

  constructor(protected transport: ITransport, readonly localId: string) {
    // Register for changes.
    this.transport.subscribe(
      '$network',
      new Subscription(this.registerRemote.bind(this)),
    );
  }

  protected registerRemote(msg: Message<Update>) {
    // Quit on self.
    if (msg.content.node == this.localId) {
      return;
    }

    console.log('Remote node registering', {
      update: msg.content,
      localId: this.localId,
    });

    if (!this.listeners.has(msg.content.channel)) {
      this.listeners.set(msg.content.channel, new Set());
    }

    this.listeners.get(msg.content.channel).add(msg.content.node);
  }

  async registerLocal(channel: string) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }

    this.listeners.get(channel).add(this.localId);

    if (channel !== '$network') {
      console.log('Publishing network update', {
        node: this.localId,
        channel,
      });

      const msg = new Message<Update>();
      msg.content = {
        node: this.localId,
        channel,
      };

      await this.transport.publish('$network', msg);
    }
  }

  findListener(channel: string): string {
    if (this.listeners.has(channel)) {
      const listeners = Array.from(this.listeners.get(channel).values());
      let i = 0;

      console.log('Listeners', { listeners });

      while (++i) {
        const r = Math.random();
        const w = 1 / listeners.length;

        if (r <= w) {
          const k = i % listeners.length;

          const listener = listeners[k];

          console.log('Randomly selected node', {
            node: listener,
          });

          return `${channel}.${listener}`;
        }
      }
    }

    throw new Error('No one listening on this channel');
  }
}
