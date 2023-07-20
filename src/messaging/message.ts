import { randomUUID } from 'crypto';

export class Message<P = string | number | unknown | boolean> {
  /**
   * @description Unique message ID will be used for reply tracking.
   */
  readonly id: string = randomUUID();

  /**
   * @description Sender node, always set.
   */
  public sender: string;

  /**
   * @description Recipient node, not set when publishing to multiple node.
   */
  public recipient?: string;

  /**
   * @description Target channel.
   */
  public channel: string;

  /**
   * @description Reply to ~ Temporary solution until the reply router is implemented.
   */
  public replyTo?: string;

  /**
   * @description Message ID which gets the reply.
   */
  public replyFor?: string;

  /**
   * @description UTC timestamp of creation.
   */
  readonly createdAt: number;

  /**
   * @description Message expiration tracker.
   */
  public timeToLive?: number;

  /**
   * @description Arbitrary message content.
   */
  public content: P;

  constructor() {
    this.createdAt = Date.now();
  }
}
