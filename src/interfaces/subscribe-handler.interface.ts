import { Message } from '../messaging/message';

export type ISubscribeHandler<I = unknown> = (
  message: Message<I>,
) => Promise<void> | void;
