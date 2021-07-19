import { Message } from '../messaging/message';

export type ISubscribeHandler = (msg: Message) => Promise<void> | void;
