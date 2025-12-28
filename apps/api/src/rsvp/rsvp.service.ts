import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rsvp, RsvpDocument } from './schemas/rsvp.schema';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as Sentiment from 'sentiment';

@Injectable()
export class RsvpService {
    private readonly logger = new Logger(RsvpService.name);
    private readonly secret: string;

    constructor(
        @InjectModel(Rsvp.name) private rsvpModel: Model<RsvpDocument>,
        private configService: ConfigService,
        @InjectQueue('sync-queue') private syncQueue: Queue,
    ) {
        this.secret = this.configService.get<string>('TICKET_SIGNING_SECRET') || 'secret';
    }

    async createOrUpdate(createRsvpDto: CreateRsvpDto) {
        const normalizedName = createRsvpDto.name.trim().replace(/\s+/g, ' ');
        const searchName = normalizedName.toLowerCase();

        // Enhanced Sentiment Analysis for Indonesian and English
        const sentiment = new Sentiment();
        const noteText = (createRsvpDto.note || '').toLowerCase();
        const noteLength = noteText.trim().length;
        const wordCount = noteText.trim().split(/\s+/).length;

        // Indonesian negative words/phrases
        const indonesianNegative = [
            'yah', 'kok', 'nikah', 'gak', 'tidak', 'jangan', 'buruk', 'jelek',
            'sedih', 'kecewa', 'marah', 'benci', 'bodoh', 'tolol', 'anjing',
            'kampret', 'bangsat', 'sialan', 'sial', 'payah', 'gagal', 'rugi',
            'menyesal', 'salah', 'hancur', 'rusak', 'busuk', 'najis'
        ];

        // Indonesian positive words/phrases
        const indonesianPositive = [
            'selamat', 'bahagia', 'sukses', 'lancar', 'jaya', 'berkah', 'rezeki',
            'cinta', 'sayang', 'indah', 'cantik', 'ganteng', 'keren', 'hebat',
            'mantap', 'bagus', 'sempurna', 'luar biasa', 'terbaik', 'senang',
            'gembira', 'suka', 'terima kasih', 'thanks', 'congratulations'
        ];

        // High-value meaningful words (extra bonus)
        const meaningfulWords = [
            'berkah', 'rezeki', 'kebahagiaan', 'keluarga', 'cinta sejati',
            'selamanya', 'barakallah', 'semoga', 'doa', 'terbaik',
            'luar biasa', 'sempurna', 'istimewa', 'spesial'
        ];

        // Calculate sentiment score
        let analysis = sentiment.analyze(noteText);
        let score = analysis.score;

        // Adjust score based on Indonesian words
        indonesianNegative.forEach(word => {
            if (noteText.includes(word)) {
                score -= 3; // Penalize negative words
            }
        });

        indonesianPositive.forEach(word => {
            if (noteText.includes(word)) {
                score += 2; // Reward positive words
            }
        });

        // Bonus for meaningful words
        meaningfulWords.forEach(word => {
            if (noteText.includes(word)) {
                score += 3; // Extra bonus for meaningful expressions
            }
        });

        // Length-based bonus for positive comments
        if (score > 0) {
            // Bonus for longer, more thoughtful messages
            if (wordCount >= 10) {
                score += 5; // Substantial message
            } else if (wordCount >= 5) {
                score += 3; // Moderate message
            } else if (wordCount >= 3) {
                score += 1; // Short but positive
            }

            // Additional bonus for very detailed messages
            if (noteLength > 100) {
                score += 3; // Very detailed
            } else if (noteLength > 50) {
                score += 2; // Detailed
            }
        }

        // Filter out very negative comments (score < -2)
        if (score < -2) {
            this.logger.warn(`Negative comment detected (score: ${score}): ${noteText.substring(0, 50)}`);
            // Still save but with very low score so it appears at bottom
            score = -999;
        }

        this.logger.log(`Sentiment score for "${noteText.substring(0, 30)}...": ${score} (words: ${wordCount}, length: ${noteLength})`);

        let ticketCode = null;
        let ticketToken = null;

        let existing = await this.rsvpModel.findOne({ normalizedName: searchName });

        if (existing && existing.ticketCode) {
            ticketCode = existing.ticketCode;
        } else if (createRsvpDto.attendanceStatus === 'Hadir') {
            ticketCode = randomUUID();
        }

        if (ticketCode && createRsvpDto.attendanceStatus === 'Hadir') {
            ticketToken = this.signTicket(ticketCode, normalizedName);
        }

        // Guest quota validation
        const guestQuota = createRsvpDto.guestQuota || 1;
        const guestCount = createRsvpDto.guestCount || 1;

        if (guestCount > guestQuota) {
            throw new BadRequestException(`Guest count (${guestCount}) exceeds quota (${guestQuota})`);
        }

        const updated = await this.rsvpModel.findOneAndUpdate(
            { normalizedName: searchName },
            {
                ...createRsvpDto,
                name: normalizedName,
                normalizedName: searchName,
                ticketCode: createRsvpDto.attendanceStatus === 'Hadir' ? ticketCode : ((existing && existing.ticketCode) || null),
                ticketIssuedAt: createRsvpDto.attendanceStatus === 'Hadir' ? new Date() : undefined,
                sentimentScore: score,
                guestQuota,
                guestCount,
            },
            { new: true, upsert: true }
        );

        // Fire-and-forget queue sync (don't block response)
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

    private signTicket(code: string, name: string): string {
        return jwt.sign({ code, name }, this.secret, { expiresIn: '90d', algorithm: 'HS256' });
    }

    verifyTicketToken(token: string): any {
        try {
            return jwt.verify(token, this.secret, { algorithms: ['HS256'] });
        } catch (e) {
            throw new Error('Invalid ticket signature');
        }
    }

    async findByTicketCode(ticketCode: string): Promise<RsvpDocument | null> {
        return this.rsvpModel.findOne({ ticketCode });
    }

    async markAsCheckedIn(id: string): Promise<RsvpDocument | null> {
        return this.rsvpModel.findByIdAndUpdate(id, {
            isCheckedIn: true,
            checkInTime: new Date(),
        }, { new: true });
    }

    async findAllGuests(query?: string): Promise<RsvpDocument[]> {
        const filter: any = {};
        if (query) {
            filter.normalizedName = { $regex: query.toLowerCase().trim() };
        }
        return this.rsvpModel.find(filter).sort({ name: 1 }).limit(100);
    }

    async getWishes(): Promise<RsvpDocument[]> {
        return this.rsvpModel.find({ note: { $exists: true, $ne: '' } })
            .sort({ sentimentScore: -1, _id: -1 }) // Sort by sentiment highest first, then newest
            .limit(50)
            .select('name note attendanceStatus sentimentScore');
    }
}
