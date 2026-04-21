import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const uploadsReports = path.join(process.cwd(), 'uploads', 'reports');
  fs.mkdirSync(uploadsReports, { recursive: true });

  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: ['https://aatmabodha1.onrender.com', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const server = app.getHttpServer();
  server.keepAliveTimeout = 170000;
  server.headersTimeout = 175000;

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, '0.0.0.0');
}

void bootstrap();

