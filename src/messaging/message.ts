import UUID = require('uuid');

export class Message<P = string | number | Object | boolean> {
  /**
   * @description Unique message ID will be used for reply tracking.
   */
  readonly id: string = UUID.v4();

  /**
   * @description Sender node, always set.
   */
  public sender: string;

  /**
   * @description Recipient node, not set when publishing to multiple node.
   */
  public recipient: string | null;

  /**
   * @description Target channel.
   */
  public channel: string;

  /**
   * @description Reply to ~ Temporary solution until the reply router is implemented.
   */
  public replyTo: string | null;

  /**
   * @description UTC timestamp of creation.
   */
  readonly createdAt: number;

  /**
   * @description Arbitrary message content.
   */
  public content: P;

  constructor() {
    this.createdAt = new Date().getUTCMilliseconds();
  }
}
