import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { RsvpService } from '../rsvp/rsvp.service';

@Injectable()
export class CheckinService {
    private readonly logger = new Logger(CheckinService.name);

    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
        private rsvpService: RsvpService,
    ) { }

    async checkIn(token: string, ip: string, userAgent: string) {
        let payload: any;
        try {
            payload = this.rsvpService.verifyTicketToken(token);
        } catch (e) {
            await this.log(token, 'CHECKIN', 'FAIL', 'Invalid Signature', ip, userAgent);
            throw new BadRequestException('Invalid ticket signature');
        }

        const { code } = payload;
        const rsvp = await this.rsvpService.findByTicketCode(code);

        if (!rsvp) {
            await this.log(code, 'CHECKIN', 'FAIL', 'Ticket Code not found in DB', ip, userAgent);
            throw new NotFoundException('Guest not found');
        }

        if (rsvp.isCheckedIn) {
            await this.log(code, 'CHECKIN', 'FAIL', 'Already Checked In', ip, userAgent);
            return {
                success: false,
                message: 'Guest already checked in',
                rsvp,
            };
        }

        const updated = await this.rsvpService.markAsCheckedIn(rsvp._id.toString());
        if (!updated) {
            throw new NotFoundException('Failed to update RSVP');
        }
        await this.log(code, 'CHECKIN', 'SUCCESS', `Checked in ${updated.name}`, ip, userAgent);

        return {
            success: true,
            rsvp: updated,
        };
    }

    async searchGuests(query: string) {
        return this.rsvpService.findAllGuests(query);
    }

    async getLogs(limit: number = 50) {
        return this.auditLogModel.find().sort({ createdAt: -1 }).limit(limit);
    }

    private async log(ticketCode: string, action: string, status: string, details: string, ip: string, userAgent: string) {
        await this.auditLogModel.create({
            action,
            status,
            details,
            ticketCode,
            operatorIp: ip,
            userAgent,
        });
    }
}
