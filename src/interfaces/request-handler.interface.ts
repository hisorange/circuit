import { Message } from '../messaging/message';

export type IRequestHandler<I = unknown, O = unknown> = (
  msg: Message<I>,
) => Promise<O> | O;
