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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rsvp_schema_1 = require("../rsvp/schemas/rsvp.schema");
const ExcelJS = require("exceljs");
let AdminService = class AdminService {
    constructor(jwtService, configService, rsvpModel) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.rsvpModel = rsvpModel;
    }
    async login(username, password) {
        const adminUsername = this.configService.get('ADMIN_USERNAME') || 'admin';
        const adminPassword = this.configService.get('ADMIN_PASSWORD') || 'admin123';
        if (username !== adminUsername || password !== adminPassword) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { username, role: 'admin' };
        return {
            access_token: this.jwtService.sign(payload),
            username,
        };
    }
    async getGuests(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        const [guests, total] = await Promise.all([
            this.rsvpModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.rsvpModel.countDocuments(query).exec(),
        ]);
        return {
            guests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStats() {
        const [total, attending, notAttending, checkedIn] = await Promise.all([
            this.rsvpModel.countDocuments().exec(),
            this.rsvpModel.countDocuments({ attendanceStatus: 'Hadir' }).exec(),
            this.rsvpModel.countDocuments({ attendanceStatus: 'Tidak' }).exec(),
            this.rsvpModel.countDocuments({ checkedInAt: { $exists: true, $ne: null } }).exec(),
        ]);
        const guestCountResult = await this.rsvpModel.aggregate([
            { $match: { attendanceStatus: 'Hadir' } },
            { $group: { _id: null, totalGuests: { $sum: { $ifNull: ['$guestCount', 1] } } } }
        ]).exec();
        const totalGuestCount = guestCountResult.length > 0 ? guestCountResult[0].totalGuests : 0;
        const [gerejaResult, resepsiResult, keduanyaResult] = await Promise.all([
            this.rsvpModel.aggregate([
                { $match: { attendanceStatus: 'Hadir', attendanceChoice: 'Gereja' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$guestCount', 1] } } } }
            ]).exec(),
            this.rsvpModel.aggregate([
                { $match: { attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$guestCount', 1] } } } }
            ]).exec(),
            this.rsvpModel.aggregate([
                { $match: { attendanceStatus: 'Hadir', attendanceChoice: 'Keduanya' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$guestCount', 1] } } } }
            ]).exec(),
        ]);
        const attendingGereja = gerejaResult.length > 0 ? gerejaResult[0].total : 0;
        const attendingResepsi = resepsiResult.length > 0 ? resepsiResult[0].total : 0;
        const attendingKeduanya = keduanyaResult.length > 0 ? keduanyaResult[0].total : 0;
        return {
            total,
            attending,
            notAttending,
            checkedIn,
            totalGuestCount,
            byEvent: {
                gereja: attendingGereja,
                resepsi: attendingResepsi,
                keduanya: attendingKeduanya,
            },
        };
    }
    async checkInByQR(qrData, adminUsername) {
        try {
            const decoded = this.jwtService.verify(qrData, {
                secret: this.configService.get('TICKET_SIGNING_SECRET') || 'secret'
            });
            const ticketCode = decoded.code;
            const guestName = decoded.name;
            const rsvp = await this.rsvpModel.findOne({ ticketCode }).exec();
            if (!rsvp) {
                return {
                    success: false,
                    message: 'Guest not found',
                };
            }
            if (rsvp.checkedInAt) {
                return {
                    success: false,
                    message: 'Guest already checked in',
                    guest: rsvp,
                };
            }
            rsvp.checkedInAt = new Date();
            rsvp.checkedInBy = adminUsername;
            rsvp.checkInMethod = 'qr';
            rsvp.isCheckedIn = true;
            await rsvp.save();
            return {
                success: true,
                message: 'Check-in successful',
                guest: {
                    name: rsvp.name,
                    attendanceChoice: rsvp.attendanceChoice,
                    checkedInAt: rsvp.checkedInAt,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Invalid QR code or expired token',
            };
        }
    }
    async exportToExcel() {
        const guests = await this.rsvpModel.find().sort({ createdAt: -1 }).exec();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Wedding Guests');
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Attendance Status', key: 'attendanceStatus', width: 20 },
            { header: 'Event', key: 'attendanceChoice', width: 20 },
            { header: 'Note/Wishes', key: 'note', width: 40 },
            { header: 'Checked In', key: 'checkedIn', width: 15 },
            { header: 'Check-in Time', key: 'checkedInAt', width: 25 },
            { header: 'Check-in Method', key: 'checkInMethod', width: 15 },
            { header: 'Submitted At', key: 'createdAt', width: 25 },
        ];
        guests.forEach((guest) => {
            const guestDoc = guest;
            worksheet.addRow({
                name: guest.name,
                attendanceStatus: guest.attendanceStatus,
                attendanceChoice: guest.attendanceChoice,
                guestCount: guest.guestCount || 1,
                note: guest.note || '-',
                checkedIn: guest.checkedInAt ? 'Yes' : 'No',
                checkedInAt: guest.checkedInAt ? guest.checkedInAt.toISOString() : '-',
                checkInMethod: guest.checkInMethod || '-',
                createdAt: guestDoc.createdAt ? guestDoc.createdAt.toISOString() : '-',
            });
        });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD700' },
        };
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    async createGuestManually(dto, adminUsername) {
        const normalizedName = dto.name.trim().replace(/\s+/g, ' ');
        const searchName = normalizedName.toLowerCase();
        const existing = await this.rsvpModel.findOne({ normalizedName: searchName }).exec();
        if (existing) {
            throw new common_1.UnauthorizedException('Guest with this name already exists');
        }
        let ticketCode = null;
        let ticketToken = null;
        if (dto.attendanceStatus === 'Hadir') {
            const { randomUUID } = await Promise.resolve().then(() => require('crypto'));
            ticketCode = randomUUID();
            ticketToken = this.jwtService.sign({ code: ticketCode, name: normalizedName }, {
                secret: this.configService.get('TICKET_SIGNING_SECRET') || 'secret',
                expiresIn: '90d'
            });
        }
        const newRsvp = new this.rsvpModel({
            name: normalizedName,
            normalizedName: searchName,
            attendanceStatus: dto.attendanceStatus,
            attendanceChoice: dto.attendanceChoice,
            note: dto.note || '',
            ticketCode,
            ticketIssuedAt: ticketCode ? new Date() : undefined,
            sentimentScore: 0,
        });
        await newRsvp.save();
        return {
            success: true,
            message: 'Guest created successfully',
            guest: {
                id: newRsvp._id,
                name: newRsvp.name,
                attendanceStatus: newRsvp.attendanceStatus,
                attendanceChoice: newRsvp.attendanceChoice,
                ticketToken,
            },
        };
    }
    async updateGuest(id, dto, adminUsername) {
        const guest = await this.rsvpModel.findById(id).exec();
        if (!guest) {
            throw new common_1.UnauthorizedException('Guest not found');
        }
        if (dto.attendanceStatus !== undefined) {
            guest.attendanceStatus = dto.attendanceStatus;
            if (dto.attendanceStatus === 'Hadir' && !guest.ticketCode) {
                const { randomUUID } = await Promise.resolve().then(() => require('crypto'));
                guest.ticketCode = randomUUID();
                guest.ticketIssuedAt = new Date();
            }
        }
        if (dto.attendanceChoice !== undefined) {
            guest.attendanceChoice = dto.attendanceChoice;
        }
        if (dto.isCheckedIn !== undefined) {
            guest.isCheckedIn = dto.isCheckedIn;
            if (dto.isCheckedIn && !guest.checkedInAt) {
                guest.checkedInAt = new Date();
                guest.checkedInBy = adminUsername;
                guest.checkInMethod = 'manual';
            }
            else if (!dto.isCheckedIn) {
                guest.set('checkedInAt', undefined, { strict: false });
                guest.set('checkedInBy', undefined, { strict: false });
                guest.set('checkInMethod', undefined, { strict: false });
            }
        }
        if (dto.note !== undefined) {
            guest.note = dto.note;
        }
        await guest.save();
        let ticketToken = null;
        if (guest.ticketCode && guest.attendanceStatus === 'Hadir') {
            ticketToken = this.jwtService.sign({ code: guest.ticketCode, name: guest.name }, {
                secret: this.configService.get('TICKET_SIGNING_SECRET') || 'secret',
                expiresIn: '90d'
            });
        }
        return {
            success: true,
            message: 'Guest updated successfully',
            guest: {
                id: guest._id,
                name: guest.name,
                attendanceStatus: guest.attendanceStatus,
                attendanceChoice: guest.attendanceChoice,
                isCheckedIn: guest.isCheckedIn,
                ticketToken,
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(rsvp_schema_1.Rsvp.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map