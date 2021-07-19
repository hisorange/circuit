import { Message } from '../message';
import { ISubscription } from './subscription.interface';

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  publish(channel: string, message: Message): Promise<void>;
  subscribe(channel: string, subscriber: ISubscription): Promise<void>;
}
