import { CheckinService } from './checkin.service';
export declare class CheckinController {
    private readonly checkinService;
    constructor(checkinService: CheckinService);
    checkIn(token: string, req: any): Promise<{
        success: boolean;
        message: string;
        rsvp: import("mongoose").Document<unknown, {}, import("../rsvp/schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("../rsvp/schemas/rsvp.schema").Rsvp & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
    } | {
        success: boolean;
        rsvp: import("mongoose").Document<unknown, {}, import("../rsvp/schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("../rsvp/schemas/rsvp.schema").Rsvp & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        };
        message?: undefined;
    }>;
}
