import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Rsvp, RsvpDocument } from '../rsvp/schemas/rsvp.schema';
import * as ExcelJS from 'exceljs';
export declare class AdminService {
    private jwtService;
    private configService;
    private rsvpModel;
    constructor(jwtService: JwtService, configService: ConfigService, rsvpModel: Model<RsvpDocument>);
    login(username: string, password: string): Promise<{
        access_token: string;
        username: string;
    }>;
    getGuests(page?: number, limit?: number, search?: string): Promise<{
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
    checkInByQR(qrData: string, adminUsername: string): Promise<{
        success: boolean;
        message: string;
        guest?: undefined;
    } | {
        success: boolean;
        message: string;
        guest: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Rsvp, {}, import("mongoose").DefaultSchemaOptions> & Rsvp & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Rsvp, {}, import("mongoose").DefaultSchemaOptions> & Rsvp & {
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
    exportToExcel(): Promise<ExcelJS.Buffer>;
    createGuestManually(dto: {
        name: string;
        attendanceStatus: string;
        attendanceChoice: string;
        note?: string;
    }, adminUsername: string): Promise<{
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
    updateGuest(id: string, dto: {
        attendanceStatus?: string;
        attendanceChoice?: string;
        isCheckedIn?: boolean;
        note?: string;
    }, adminUsername: string): Promise<{
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
}
