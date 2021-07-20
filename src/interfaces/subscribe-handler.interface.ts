import { Message } from '../messaging/message';

export type ISubscribeHandler<I = any> = (
  message: Message<I>,
) => Promise<void> | void;
