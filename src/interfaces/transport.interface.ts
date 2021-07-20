import { Message } from '../messaging/message';
import { ISerializer } from './serializer.interface';
import { ISubscription } from './subscription.interface';

export interface ITransport {
  /**
   * Create connection to the transport medium.
   *
   * @throws {AlreadyConnectedException}
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the transport medium.
   */
  disconnect(): Promise<void>;

  /**
   * @description Check for the connection status.
   */
  isConnected(): boolean;

  /**
   * @description Message serializer.
   */
  readonly serializer: ISerializer;

  publish(channel: string, message: Message): Promise<void>;
  subscribe(channel: string, subscriber: ISubscription): Promise<void>;
}
