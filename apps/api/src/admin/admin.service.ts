import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rsvp, RsvpDocument } from '../rsvp/schemas/rsvp.schema';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AdminService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(Rsvp.name) private rsvpModel: Model<RsvpDocument>,
    ) { }

    async login(username: string, password: string) {
        const adminUsername = this.configService.get<string>('ADMIN_USERNAME') || 'admin';
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';

        if (username !== adminUsername || password !== adminPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { username, role: 'admin' };
        return {
            access_token: this.jwtService.sign(payload),
            username,
        };
    }

    async getGuests(page: number = 1, limit: number = 20, search?: string) {
        const skip = (page - 1) * limit;
        const query: any = {};

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

        // Calculate total guest count (sum of guestCount for attending guests)
        const guestCountResult = await this.rsvpModel.aggregate([
            { $match: { attendanceStatus: 'Hadir' } },
            { $group: { _id: null, totalGuests: { $sum: { $ifNull: ['$guestCount', 1] } } } }
        ]).exec();

        const totalGuestCount = guestCountResult.length > 0 ? guestCountResult[0].totalGuests : 0;

        // Calculate guest counts by event type (sum of guestCount, not RSVP count)
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
            totalGuestCount, // Total number of actual guests
            byEvent: {
                gereja: attendingGereja,
                resepsi: attendingResepsi,
                keduanya: attendingKeduanya,
            },
        };
    }

    async checkInByQR(qrData: string, adminUsername: string) {
        try {
            // Verify JWT token and extract ticketCode
            const decoded = this.jwtService.verify(qrData, {
                secret: this.configService.get<string>('TICKET_SIGNING_SECRET') || 'secret'
            });

            const ticketCode = decoded.code;
            const guestName = decoded.name;

            // Find guest by ticketCode
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

            // Update check-in details
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
        } catch (error) {
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

        // Define columns
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

        // Add rows
        guests.forEach((guest) => {
            const guestDoc = guest as any; // Cast to access timestamps
            worksheet.addRow({
                name: guest.name,
                attendanceStatus: guest.attendanceStatus,
                attendanceChoice: guest.attendanceChoice,
                guestCount: (guest as any).guestCount || 1,
                note: guest.note || '-',
                checkedIn: guest.checkedInAt ? 'Yes' : 'No',
                checkedInAt: guest.checkedInAt ? guest.checkedInAt.toISOString() : '-',
                checkInMethod: guest.checkInMethod || '-',
                createdAt: guestDoc.createdAt ? guestDoc.createdAt.toISOString() : '-',
            });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD700' },
        };

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    async createGuestManually(dto: { name: string; attendanceStatus: string; attendanceChoice: string; note?: string }, adminUsername: string) {
        const normalizedName = dto.name.trim().replace(/\s+/g, ' ');
        const searchName = normalizedName.toLowerCase();

        // Check if guest already exists
        const existing = await this.rsvpModel.findOne({ normalizedName: searchName }).exec();
        if (existing) {
            throw new UnauthorizedException('Guest with this name already exists');
        }

        // Generate ticket if attending
        let ticketCode = null;
        let ticketToken = null;
        if (dto.attendanceStatus === 'Hadir') {
            const { randomUUID } = await import('crypto');
            ticketCode = randomUUID();
            ticketToken = this.jwtService.sign(
                { code: ticketCode, name: normalizedName },
                {
                    secret: this.configService.get<string>('TICKET_SIGNING_SECRET') || 'secret',
                    expiresIn: '90d'
                }
            );
        }

        // Create new RSVP
        const newRsvp = new this.rsvpModel({
            name: normalizedName,
            normalizedName: searchName,
            attendanceStatus: dto.attendanceStatus,
            attendanceChoice: dto.attendanceChoice,
            note: dto.note || '',
            ticketCode,
            ticketIssuedAt: ticketCode ? new Date() : undefined,
            sentimentScore: 0, // Manual entries get neutral score
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

    async updateGuest(id: string, dto: { attendanceStatus?: string; attendanceChoice?: string; isCheckedIn?: boolean; note?: string }, adminUsername: string) {
        const guest = await this.rsvpModel.findById(id).exec();

        if (!guest) {
            throw new UnauthorizedException('Guest not found');
        }

        // Update fields
        if (dto.attendanceStatus !== undefined) {
            guest.attendanceStatus = dto.attendanceStatus;

            // Generate ticket if changing to Hadir and no ticket exists
            if (dto.attendanceStatus === 'Hadir' && !guest.ticketCode) {
                const { randomUUID } = await import('crypto');
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
            } else if (!dto.isCheckedIn) {
                // Use $unset to remove fields
                guest.set('checkedInAt', undefined, { strict: false });
                guest.set('checkedInBy', undefined, { strict: false });
                guest.set('checkInMethod', undefined, { strict: false });
            }
        }

        if (dto.note !== undefined) {
            guest.note = dto.note;
        }

        await guest.save();

        // Generate ticket token if needed
        let ticketToken = null;
        if (guest.ticketCode && guest.attendanceStatus === 'Hadir') {
            ticketToken = this.jwtService.sign(
                { code: guest.ticketCode, name: guest.name },
                {
                    secret: this.configService.get<string>('TICKET_SIGNING_SECRET') || 'secret',
                    expiresIn: '90d'
                }
            );
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
}
