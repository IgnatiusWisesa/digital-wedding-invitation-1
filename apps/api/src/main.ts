import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;

  // Enable CORS for frontend
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(port);
}
bootstrap();
