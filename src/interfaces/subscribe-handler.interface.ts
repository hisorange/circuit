import { Message } from '../message';

export type ISubscribeHandler = (msg: Message) => Promise<void> | void;
