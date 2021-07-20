import { Message } from '../messaging/message';

export interface ISerializer {
  serialize(message: Message): string;
  deserialize(raw: string): Message;
}
