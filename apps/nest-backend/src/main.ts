import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (req, res) => {
    res.sendFile(require('path').join(process.cwd(), 'src', 'docs.html'));
  });
  
  // Enable CORS (like Laravel)
  app.enableCors({
    origin: '*', // Allow all origins for dev, or specify Vercel URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, ngrok-skip-browser-warning',
  });

  // Set global prefix to match Laravel
  app.setGlobalPrefix('api/v1');

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
