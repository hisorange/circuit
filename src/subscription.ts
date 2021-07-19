import { ISubscribeHandler } from './interfaces';
import { ISubscription } from './interfaces/subscription.interface';
import UUID = require('uuid');

export class Subscription implements ISubscription {
  readonly id: string = UUID.v4();

  constructor(readonly handler: ISubscribeHandler) {}
}
