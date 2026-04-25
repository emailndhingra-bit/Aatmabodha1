"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express = require("express");
const fs = require("fs");
const path = require("path");
async function bootstrap() {
    const uploadsReports = path.join(process.cwd(), 'uploads', 'reports');
    fs.mkdirSync(uploadsReports, { recursive: true });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    app.enableCors({
        origin: ['https://aatmabodha1.onrender.com', 'http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const server = app.getHttpServer();
    server.keepAliveTimeout = 170000;
    server.headersTimeout = 175000;
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, '0.0.0.0');
}
void bootstrap();
//# sourceMappingURL=main.js.map