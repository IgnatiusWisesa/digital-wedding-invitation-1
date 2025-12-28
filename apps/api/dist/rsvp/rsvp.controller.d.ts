import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
export declare class RsvpController {
    private readonly rsvpService;
    constructor(rsvpService: RsvpService);
    create(createRsvpDto: CreateRsvpDto): Promise<{
        success: boolean;
        rsvp: {
            name: string;
            attendanceStatus: string;
            ticketToken: string | null;
        };
    }>;
    getWishes(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/rsvp.schema").Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
}
