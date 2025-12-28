import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { RsvpService } from '../rsvp/rsvp.service';
export declare class CheckinService {
    private auditLogModel;
    private rsvpService;
    private readonly logger;
    constructor(auditLogModel: Model<AuditLogDocument>, rsvpService: RsvpService);
    checkIn(token: string, ip: string, userAgent: string): Promise<{
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
    searchGuests(query: string): Promise<(import("mongoose").Document<unknown, {}, import("../rsvp/schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("../rsvp/schemas/rsvp.schema").Rsvp & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    getLogs(limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    private log;
}
