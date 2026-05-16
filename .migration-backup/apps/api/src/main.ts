import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { join } from 'path';

// Ensure uploads directory exists to prevent ServeStaticModule crash on ephemeral file systems
const uploadsDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
