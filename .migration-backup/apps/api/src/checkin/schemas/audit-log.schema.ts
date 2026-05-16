import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
    @Prop({ required: true })
    action: string; // "CHECKIN", "SEARCH", "VERIFY_FAIL"

    @Prop()
    details: string;

    @Prop()
    operatorIp: string;

    @Prop()
    userAgent: string;

    @Prop()
    status: string; // "SUCCESS", "FAIL"

    @Prop()
    ticketCode: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
