import { LogLevel } from '@nestjs/common';

function getLoggingLevels(isProduction: boolean): LogLevel[] {
  if (isProduction) {
    return ['log', 'warn', 'error'];
  }
  return ['error', 'warn', 'log', 'verbose', 'debug'];
}

export default getLoggingLevels;
