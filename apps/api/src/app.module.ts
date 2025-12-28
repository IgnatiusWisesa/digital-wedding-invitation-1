import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RsvpModule } from './rsvp/rsvp.module';
import { QueueModule } from './queue/queue.module';
import { BullModule } from '@nestjs/bullmq';
import { CheckinModule } from './checkin/checkin.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_CONNECTION_STRING'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URL');
        // Parse URL if needed or just pass connection
        const connection: any = {};
        if (url) {
          try {
            const parsed = new URL(url);
            connection.host = parsed.hostname;
            connection.port = Number(parsed.port);
            // password/db if needed
          } catch (e) {
            // fallback or error
            connection.host = 'localhost';
            connection.port = 6379;
          }
        }
        return { connection };
      },
      inject: [ConfigService],
    }),
    RsvpModule,
    QueueModule,
    CheckinModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
