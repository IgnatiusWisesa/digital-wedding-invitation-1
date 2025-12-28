"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CheckinService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
const rsvp_service_1 = require("../rsvp/rsvp.service");
let CheckinService = CheckinService_1 = class CheckinService {
    constructor(auditLogModel, rsvpService) {
        this.auditLogModel = auditLogModel;
        this.rsvpService = rsvpService;
        this.logger = new common_1.Logger(CheckinService_1.name);
    }
    async checkIn(token, ip, userAgent) {
        let payload;
        try {
            payload = this.rsvpService.verifyTicketToken(token);
        }
        catch (e) {
            await this.log(token, 'CHECKIN', 'FAIL', 'Invalid Signature', ip, userAgent);
            throw new common_1.BadRequestException('Invalid ticket signature');
        }
        const { code } = payload;
        const rsvp = await this.rsvpService.findByTicketCode(code);
        if (!rsvp) {
            await this.log(code, 'CHECKIN', 'FAIL', 'Ticket Code not found in DB', ip, userAgent);
            throw new common_1.NotFoundException('Guest not found');
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
            throw new common_1.NotFoundException('Failed to update RSVP');
        }
        await this.log(code, 'CHECKIN', 'SUCCESS', `Checked in ${updated.name}`, ip, userAgent);
        return {
            success: true,
            rsvp: updated,
        };
    }
    async searchGuests(query) {
        return this.rsvpService.findAllGuests(query);
    }
    async getLogs(limit = 50) {
        return this.auditLogModel.find().sort({ createdAt: -1 }).limit(limit);
    }
    async log(ticketCode, action, status, details, ip, userAgent) {
        await this.auditLogModel.create({
            action,
            status,
            details,
            ticketCode,
            operatorIp: ip,
            userAgent,
        });
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = CheckinService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        rsvp_service_1.RsvpService])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map