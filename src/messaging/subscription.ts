import { randomUUID } from 'crypto';
import { IRequestHandler, ISubscribeHandler } from '../interfaces';
import { ISubscription } from '../interfaces/subscription.interface';

export class Subscription implements ISubscription {
  readonly id: string = randomUUID();

  constructor(readonly handler: ISubscribeHandler | IRequestHandler) {}
}
