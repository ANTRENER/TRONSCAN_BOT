import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const expressApp = express();

async function createNestApp(expressInstance: express.Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Отключаем CORS для Vercel
  app.enableCors();

  await app.init();

  return app;
}

// Для Vercel
export default async function handler(req: any, res: any) {
  if (!expressApp.listenerCount('request')) {
    await createNestApp(expressApp);
  }
  expressApp(req, res);
}

// Для локальной разработки
async function bootstrap() {
  const app = await createNestApp(express());
  await app.listen(process.env.PORT ?? 3000);
}

// Запуск только если не в Vercel среде
if (process.env.VERCEL !== '1') {
  bootstrap();
}
