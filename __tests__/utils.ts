import { InMemoryTransport, IoRedisTransport } from '../src/transports';

export function createTransport() {
  switch (process.env.TEST_TRANSPORT) {
    case 'ioredis':
      return new IoRedisTransport({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: process.env.REDIS_PORT
          ? parseInt(process.env.REDIS_PORT, 10)
          : 6379,
      });

    default:
      return new InMemoryTransport();
  }
}
