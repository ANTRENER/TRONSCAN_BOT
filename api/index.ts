import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
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
