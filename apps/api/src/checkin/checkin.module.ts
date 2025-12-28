import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { RsvpModule } from '../rsvp/rsvp.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
        RsvpModule,
        ConfigModule,
    ],
    controllers: [CheckinController],
    providers: [CheckinService],
})
export class CheckinModule { }
