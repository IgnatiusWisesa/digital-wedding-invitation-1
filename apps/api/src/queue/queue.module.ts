import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncProcessor } from './sync.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'sync-queue',
        }),
        ConfigModule,
    ],
    providers: [SyncProcessor],
    exports: [BullModule],
})
export class QueueModule { }
