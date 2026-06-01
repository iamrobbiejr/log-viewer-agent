import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ProxyModule } from './proxy/proxy.module';
import { User } from './auth/user.entity';
import { Machine } from './machines/machine.entity';
import { MachinesModule } from './machines/machines.module';
import { Setting } from './settings/setting.entity';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_URL ? 'postgres' : 'better-sqlite3',
      url: process.env.DATABASE_URL,
      database: process.env.DATABASE_URL ? undefined : 'database.sqlite',
      entities: [User, Machine, Setting],
      synchronize: true, // Auto-create schema in development
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
    }),
    AuthModule,
    AdminModule,
    ProxyModule,
    MachinesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
