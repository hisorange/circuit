import { ISubscription } from './subscription.interface';

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, subscriber: ISubscription): Promise<void>;
}
