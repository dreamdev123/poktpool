import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PoktPoolModule } from './poktpool.module';
import { TransformInterceptor } from './transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import getLoggingLevels from './utils/getLoggingLevels';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create<NestExpressApplication>(PoktPoolModule, {
    logger: getLoggingLevels(process.env.STAGE === 'prod'),
    bufferLogs: true,
  });
  app.setGlobalPrefix('poktpool');
  // this should save us some time from doing pipes in controllers
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('poktpool App')
    .setDescription('poktpool API Documentation')
    .setVersion('0.1')
    .addTag('PoktPool')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('poktpool/v1/api', app, document);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const port = process.env.PORT;
  await app.listen(port);
  logger.log(`poktpool API Running on: ${await app.getUrl()}`);
  // console.log(`PoktPool API Running on: ${await app.getUrl()}`);
}
bootstrap();
// AppClusterService.clusterize(bootstrap);
