import { AdminService } from './admin.service';
import { Response } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        username: string;
    }>;
    getGuests(page?: string, limit?: string, search?: string): Promise<{
        guests: {
            ticketToken: string | null;
            _id: import("mongoose").Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            isNew: boolean;
            schema: import("mongoose").Schema;
            name: string;
            normalizedName: string;
            attendanceChoice: string;
            note: string;
            attendanceStatus: string;
            ticketCode: string;
            ticketIssuedAt: Date;
            isCheckedIn: boolean;
            checkInTime: Date;
            qrCodeData: string;
            checkedInAt: Date;
            checkedInBy: string;
            checkInMethod: string;
            sentimentScore: number;
            guestQuota: number;
            guestCount: number;
            __v: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        total: number;
        attending: number;
        notAttending: number;
        checkedIn: number;
        totalGuestCount: any;
        byEvent: {
            gereja: any;
            resepsi: any;
            keduanya: any;
        };
    }>;
    createGuest(body: {
        name: string;
        attendanceStatus: string;
        attendanceChoice: string;
        note?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        guest: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            attendanceStatus: string;
            attendanceChoice: string;
            ticketToken: string | null;
        };
    }>;
    updateGuest(id: string, body: {
        attendanceStatus?: string;
        attendanceChoice?: string;
        isCheckedIn?: boolean;
        note?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        guest: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            attendanceStatus: string;
            attendanceChoice: string;
            isCheckedIn: boolean;
            ticketToken: string | null;
        };
    }>;
    checkInByQR(body: {
        qrData: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        guest?: undefined;
    } | {
        success: boolean;
        message: string;
        guest: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../rsvp/schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("../rsvp/schemas/rsvp.schema").Rsvp & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../rsvp/schemas/rsvp.schema").Rsvp, {}, import("mongoose").DefaultSchemaOptions> & import("../rsvp/schemas/rsvp.schema").Rsvp & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    } | {
        success: boolean;
        message: string;
        guest: {
            name: string;
            attendanceChoice: string;
            checkedInAt: Date;
        };
    }>;
    exportGuests(res: Response): Promise<void>;
}
