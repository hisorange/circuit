export interface NetworkChangeMessage {
  action: 'add' | 'remove' | 'join';
  channels: string[];
}
