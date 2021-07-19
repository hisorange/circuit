import { ISubscribeHandler } from './subscribe-handler.interface';

export interface ISubscription {
  readonly id: string;
  readonly handler: ISubscribeHandler;
}
