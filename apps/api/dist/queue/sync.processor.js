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
var SyncProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
let SyncProcessor = SyncProcessor_1 = class SyncProcessor extends bullmq_1.WorkerHost {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new common_1.Logger(SyncProcessor_1.name);
        this.initGoogleClient();
    }
    async initGoogleClient() {
        try {
            const keyFileOrString = this.configService.get('GOOGLE_SERVICE_ACCOUNT_JSON');
            const sheetId = this.configService.get('GOOGLE_SHEETS_ID');
            if (!keyFileOrString || !sheetId) {
                this.logger.warn('Google Sheets credentials or ID not provided. Sync will fail.');
                return;
            }
            let authOptions = {
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            };
            if (keyFileOrString.trim().startsWith('{')) {
                authOptions.credentials = JSON.parse(keyFileOrString);
            }
            else {
                authOptions.keyFile = keyFileOrString;
            }
            const auth = new googleapis_1.google.auth.GoogleAuth(authOptions);
            const authClient = await auth.getClient();
            this.sheetsClient = googleapis_1.google.sheets({ version: 'v4', auth: authClient });
            this.spreadsheetId = sheetId;
            this.logger.log('Google Sheets client initialized.');
        }
        catch (error) {
            this.logger.error('Failed to initialize Google Sheets client', error);
        }
    }
    async process(job) {
        if (!this.sheetsClient) {
            throw new Error('Google Sheets client not ready');
        }
        this.logger.log(`Processing sync job ${job.id} for ${job.data.name}`);
        const { name, attendanceChoice, attendanceStatus, note, timestamp } = job.data;
        try {
            await this.sheetsClient.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Sheet1!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [name, attendanceChoice, attendanceStatus, note || '', timestamp]
                    ],
                },
            });
            this.logger.log(`Synced RSVP for ${name} to Sheets.`);
        }
        catch (error) {
            this.logger.error(`Failed to sync to Sheets`, error);
            throw error;
        }
    }
};
exports.SyncProcessor = SyncProcessor;
exports.SyncProcessor = SyncProcessor = SyncProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('sync-queue'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SyncProcessor);
//# sourceMappingURL=sync.processor.js.map