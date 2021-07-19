import UUID = require('uuid');

export class Message<P = string | number | Object | boolean> {
  readonly id: string = UUID.v4();

  public channel: string;
  public replyChannel: string | null;

  constructor(readonly params: P) {}
}
