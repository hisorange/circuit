import { ISerializer } from '../interfaces';
import { Message } from '../messaging/message';

export class JsonSerializer implements ISerializer {
  serialize(message: Message): string {
    return JSON.stringify(message);
  }

  deserialize(messageString: string): Message {
    const messageRaw: Message = JSON.parse(messageString);
    const message = new Message();

    for (const key in messageRaw) {
      if (Object.prototype.hasOwnProperty.call(messageRaw, key)) {
        message[key] = messageRaw[key];
      }
    }

    return message;
  }
}
