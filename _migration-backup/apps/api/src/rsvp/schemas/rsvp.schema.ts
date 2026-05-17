import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RsvpDocument = HydratedDocument<Rsvp>;

@Schema({ timestamps: true })
export class Rsvp {
    @Prop({ required: true, trim: true })
    name: string;

    // Normalized name for idempotency and searching
    @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
    normalizedName: string;

    @Prop({ required: true })
    attendanceChoice: string; // e.g. "Gereja", "Resepsi", "Keduanya"

    @Prop()
    note: string;

    @Prop({ required: true })
    attendanceStatus: string; // "Hadir", "Tidak"

    // Ticket details
    @Prop({ unique: true, sparse: true })
    ticketCode: string;

    @Prop()
    ticketIssuedAt: Date;

    // Check-in details
    @Prop({ default: false })
    isCheckedIn: boolean;

    @Prop()
    checkInTime: Date;

    // QR Code and Admin Check-in Fields
    @Prop({ unique: true, sparse: true })
    qrCodeData: string; // Unique identifier for QR code (ticketCode)

    @Prop()
    checkedInAt: Date; // Timestamp when guest checked in

    @Prop()
    checkedInBy: string; // Admin username who performed check-in

    @Prop({ enum: ['qr', 'manual'] })
    checkInMethod: string; // How the guest checked in

    @Prop({ default: 0 })
    sentimentScore: number;

    // Guest quota system
    @Prop({ default: 1 })
    guestQuota: number; // Maximum allowed guests for this invitation

    @Prop({ default: 1 })
    guestCount: number; // Actual number of guests attending
}

export const RsvpSchema = SchemaFactory.createForClass(Rsvp);
