import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';
import { Rsvp, RsvpSchema } from './schemas/rsvp.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Rsvp.name, schema: RsvpSchema }]),
        BullModule.registerQueue({
            name: 'sync-queue',
        }),
        ConfigModule,
    ],
    controllers: [RsvpController],
    providers: [RsvpService],
    exports: [RsvpService], // Export for Queue or other modules
})
export class RsvpModule { }
