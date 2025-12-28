import { Model } from 'mongoose';
import { RsvpDocument } from './schemas/rsvp.schema';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class RsvpService {
    private rsvpModel;
    private configService;
    private syncQueue;
    private readonly logger;
    private readonly secret;
    constructor(rsvpModel: Model<RsvpDocument>, configService: ConfigService, syncQueue: Queue);
    createOrUpdate(createRsvpDto: CreateRsvpDto): Promise<{
        success: boolean;
        rsvp: {
            name: string;
            attendanceStatus: string;
            ticketToken: string | null;
        };
    }>;
    private signTicket;
    verifyTicketToken(token: string): any;
    findByTicketCode(ticketCode: string): Promise<RsvpDocument | null>;
    markAsCheckedIn(id: string): Promise<RsvpDocument | null>;
    findAllGuests(query?: string): Promise<RsvpDocument[]>;
    getWishes(): Promise<RsvpDocument[]>;
}
