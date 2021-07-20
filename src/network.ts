import { Circuit } from './circuit';
import { NotFoundException } from './exceptions';
import { NetworkChangeMessage } from './interfaces';
import { Message } from './messaging/message';

// For better visibility.
type CircuitID = string;
type ChannelID = string;

export class Network {
  protected map = new Map<ChannelID, Set<CircuitID>>();
  protected circuit: Circuit;

  bind(circuit: Circuit) {
    this.circuit = circuit;
    this.circuit.subscribe('$network', this.handleNetworkChange.bind(this));
    this.circuit.subscribe(
      '$network.' + this.circuit.id,
      this.handleNetworkChange.bind(this),
    );

    this.sendJoinMessage();
  }

  // Send a join and ask the networks to whisper their messages.
  protected sendJoinMessage() {
    const msg = new Message<NetworkChangeMessage>();
    msg.content = {
      action: 'join',
      channels: [],
    };

    this.circuit.publish('$network', msg);
  }

  protected handleNetworkChange(req: Message<NetworkChangeMessage>): void {
    // Ignore the own network changes.
    if (req.sender == this.circuit.id) {
      return;
    }

    switch (req.content.action) {
      // Add the circuit to the given channel(s).
      case 'add':
        for (const channel of req.content.channels) {
          if (!this.map.has(channel)) {
            this.map.set(channel, new Set());
          }

          this.map.get(channel).add(req.sender);
        }
        break;

      // Remove the circuit from the given channel(s)
      case 'remove':
        for (const channel of req.content.channels) {
          if (this.map.has(channel)) {
            this.map.get(channel).delete(req.sender);
          }
        }

        break;

      // Send the full map to the new circuit
      case 'join':
        this.sendOwnChannels(req.sender);

        break;
    }
  }

  protected sendOwnChannels(sender: string) {
    const join = new Message<NetworkChangeMessage>();
    const channels = [];

    for (const [channel, circuits] of this.map.entries()) {
      if (circuits.has(this.circuit.id)) {
        channels.push(channel);
      }
    }

    if (channels.length) {
      join.content = {
        action: 'add',
        channels: channels,
      };

      this.circuit.publish('$network.' + sender, join);
    }
  }

  async register(...channels: string[]) {
    channels = channels.filter(c => !c.match(/^\$network/));

    if (channels.length) {
      for (const channel of channels) {
        if (!this.map.has(channel)) {
          this.map.set(channel, new Set());
        }

        this.map.get(channel).add(this.circuit.id);
      }

      const msg = new Message<NetworkChangeMessage>();
      msg.content = {
        action: 'add',
        channels,
      };

      await this.circuit.publish('$network', msg);
    }
  }

  async deregister(...channels: string[]) {
    channels = channels.filter(c => !c.match(/^\$network/));

    if (channels.length) {
      for (const channel of channels) {
        if (this.map.has(channel)) {
          this.map.get(channel).delete(this.circuit.id);
        }
      }

      const msg = new Message<NetworkChangeMessage>();
      msg.content = {
        action: 'remove',
        channels,
      };

      await this.circuit.publish('$network', msg);
    }
  }

  find(channel: string): string {
    if (this.map.has(channel)) {
      const circuits = Array.from(this.map.get(channel).values());

      if (circuits.length) {
        // Pick a random circuit.
        return circuits[0];
      }
    }

    throw new NotFoundException();
  }
}
