"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const expressApp = (0, express_1.default)();
async function createNestApp(expressInstance) {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    // Отключаем cors для Vercel
    app.enableCors();
    await app.init();
    return app;
}
// Для Vercel
async function handler(req, res) {
    if (!expressApp.listenerCount('request')) {
        await createNestApp(expressApp);
    }
    expressApp(req, res);
}
