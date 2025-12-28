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
var RsvpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsvpService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rsvp_schema_1 = require("./schemas/rsvp.schema");
const config_1 = require("@nestjs/config");
const jwt = require("jsonwebtoken");
const crypto_1 = require("crypto");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const Sentiment = require("sentiment");
let RsvpService = RsvpService_1 = class RsvpService {
    constructor(rsvpModel, configService, syncQueue) {
        this.rsvpModel = rsvpModel;
        this.configService = configService;
        this.syncQueue = syncQueue;
        this.logger = new common_1.Logger(RsvpService_1.name);
        this.secret = this.configService.get('TICKET_SIGNING_SECRET') || 'secret';
    }
    async createOrUpdate(createRsvpDto) {
        const normalizedName = createRsvpDto.name.trim().replace(/\s+/g, ' ');
        const searchName = normalizedName.toLowerCase();
        const sentiment = new Sentiment();
        const noteText = (createRsvpDto.note || '').toLowerCase();
        const noteLength = noteText.trim().length;
        const wordCount = noteText.trim().split(/\s+/).length;
        const indonesianNegative = [
            'yah', 'kok', 'nikah', 'gak', 'tidak', 'jangan', 'buruk', 'jelek',
            'sedih', 'kecewa', 'marah', 'benci', 'bodoh', 'tolol', 'anjing',
            'kampret', 'bangsat', 'sialan', 'sial', 'payah', 'gagal', 'rugi',
            'menyesal', 'salah', 'hancur', 'rusak', 'busuk', 'najis'
        ];
        const indonesianPositive = [
            'selamat', 'bahagia', 'sukses', 'lancar', 'jaya', 'berkah', 'rezeki',
            'cinta', 'sayang', 'indah', 'cantik', 'ganteng', 'keren', 'hebat',
            'mantap', 'bagus', 'sempurna', 'luar biasa', 'terbaik', 'senang',
            'gembira', 'suka', 'terima kasih', 'thanks', 'congratulations'
        ];
        const meaningfulWords = [
            'berkah', 'rezeki', 'kebahagiaan', 'keluarga', 'cinta sejati',
            'selamanya', 'barakallah', 'semoga', 'doa', 'terbaik',
            'luar biasa', 'sempurna', 'istimewa', 'spesial'
        ];
        let analysis = sentiment.analyze(noteText);
        let score = analysis.score;
        indonesianNegative.forEach(word => {
            if (noteText.includes(word)) {
                score -= 3;
            }
        });
        indonesianPositive.forEach(word => {
            if (noteText.includes(word)) {
                score += 2;
            }
        });
        meaningfulWords.forEach(word => {
            if (noteText.includes(word)) {
                score += 3;
            }
        });
        if (score > 0) {
            if (wordCount >= 10) {
                score += 5;
            }
            else if (wordCount >= 5) {
                score += 3;
            }
            else if (wordCount >= 3) {
                score += 1;
            }
            if (noteLength > 100) {
                score += 3;
            }
            else if (noteLength > 50) {
                score += 2;
            }
        }
        if (score < -2) {
            this.logger.warn(`Negative comment detected (score: ${score}): ${noteText.substring(0, 50)}`);
            score = -999;
        }
        this.logger.log(`Sentiment score for "${noteText.substring(0, 30)}...": ${score} (words: ${wordCount}, length: ${noteLength})`);
        let ticketCode = null;
        let ticketToken = null;
        let existing = await this.rsvpModel.findOne({ normalizedName: searchName });
        if (existing && existing.ticketCode) {
            ticketCode = existing.ticketCode;
        }
        else if (createRsvpDto.attendanceStatus === 'Hadir') {
            ticketCode = (0, crypto_1.randomUUID)();
        }
        if (ticketCode && createRsvpDto.attendanceStatus === 'Hadir') {
            ticketToken = this.signTicket(ticketCode, normalizedName);
        }
        const guestQuota = createRsvpDto.guestQuota || 1;
        const guestCount = createRsvpDto.guestCount || 1;
        if (guestCount > guestQuota) {
            throw new common_1.BadRequestException(`Guest count (${guestCount}) exceeds quota (${guestQuota})`);
        }
        const updated = await this.rsvpModel.findOneAndUpdate({ normalizedName: searchName }, {
            ...createRsvpDto,
            name: normalizedName,
            normalizedName: searchName,
            ticketCode: createRsvpDto.attendanceStatus === 'Hadir' ? ticketCode : ((existing && existing.ticketCode) || null),
            ticketIssuedAt: createRsvpDto.attendanceStatus === 'Hadir' ? new Date() : undefined,
            sentimentScore: score,
            guestQuota,
            guestCount,
        }, { new: true, upsert: true });
        this.syncQueue.add('sync-rsvp', {
            name: updated.name,
            attendanceChoice: updated.attendanceChoice,
            attendanceStatus: updated.attendanceStatus,
            note: updated.note,
            timestamp: new Date().toISOString(),
        }).catch((e) => {
            this.logger.error('Failed to queue sync job', e);
        });
        return {
            success: true,
            rsvp: {
                name: updated.name,
                attendanceStatus: updated.attendanceStatus,
                ticketToken: ticketToken,
            },
        };
    }
    signTicket(code, name) {
        return jwt.sign({ code, name }, this.secret, { expiresIn: '90d', algorithm: 'HS256' });
    }
    verifyTicketToken(token) {
        try {
            return jwt.verify(token, this.secret, { algorithms: ['HS256'] });
        }
        catch (e) {
            throw new Error('Invalid ticket signature');
        }
    }
    async findByTicketCode(ticketCode) {
        return this.rsvpModel.findOne({ ticketCode });
    }
    async markAsCheckedIn(id) {
        return this.rsvpModel.findByIdAndUpdate(id, {
            isCheckedIn: true,
            checkInTime: new Date(),
        }, { new: true });
    }
    async findAllGuests(query) {
        const filter = {};
        if (query) {
            filter.normalizedName = { $regex: query.toLowerCase().trim() };
        }
        return this.rsvpModel.find(filter).sort({ name: 1 }).limit(100);
    }
    async getWishes() {
        return this.rsvpModel.find({ note: { $exists: true, $ne: '' } })
            .sort({ sentimentScore: -1, _id: -1 })
            .limit(50)
            .select('name note attendanceStatus sentimentScore');
    }
};
exports.RsvpService = RsvpService;
exports.RsvpService = RsvpService = RsvpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rsvp_schema_1.Rsvp.name)),
    __param(2, (0, bullmq_1.InjectQueue)('sync-queue')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService,
        bullmq_2.Queue])
], RsvpService);
//# sourceMappingURL=rsvp.service.js.map