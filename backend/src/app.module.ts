import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartModule } from './chart/chart.module';
import { GeminiModule } from './gemini/gemini.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QuestionsModule } from './questions/questions.module';
import { ReportsModule } from './reports/reports.module';
import { ChartsModule } from './charts/charts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'aatmabodha'),
        ssl: {
          rejectUnauthorized: false,
        },
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    ChartModule,
    GeminiModule,
    UsersModule,
    AuthModule,
    ProfilesModule,
    QuestionsModule,
    ReportsModule,
    ChartsModule,
  ],
})
export class AppModule {}

