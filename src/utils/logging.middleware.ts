import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    response.on('finish', () => {
      const { method, originalUrl } = request;
      const { statusCode, statusMessage } = response;

      if (originalUrl.includes('/health')) {
        return;
      }

      const message = `${method} ${originalUrl} ${statusCode} ${statusMessage}\n${JSON.stringify(
        request.body,
        null,
        2,
      )}`;

      if (statusCode >= 500) {
        return this.logger.error(message);
      }
      if (statusCode >= 400) {
        return this.logger.warn(message);
      }

      return this.logger.log(message);
    });
    next();
  }
}

export default LoggingMiddleware;
