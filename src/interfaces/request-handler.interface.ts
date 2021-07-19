import { Message } from '../message';

export type IRequestHandler<I = any, O = any> = (
  msg: Message<I>,
) => Promise<O> | O;
