import { pino, Level } from 'pino';
import PinoPretty from 'pino-pretty';

const stream = PinoPretty({
  colorize: false,
  minimumLevel: 'debug',
  singleLine: true,
  timestampKey: 'timestamp',
  translateTime: false,
});
export const logger = pino(
  {
    name: 'troll-app',
    level: 'debug',
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  },
  stream
);
