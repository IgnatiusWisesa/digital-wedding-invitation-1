import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Processor('sync-queue')
export class SyncProcessor extends WorkerHost {
    private readonly logger = new Logger(SyncProcessor.name);
    private sheetsClient: any;
    private spreadsheetId: string;

    constructor(private configService: ConfigService) {
        super();
        this.initGoogleClient();
    }

    private async initGoogleClient() {
        try {
            const keyFileOrString = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
            const sheetId = this.configService.get<string>('GOOGLE_SHEETS_ID');

            if (!keyFileOrString || !sheetId) {
                this.logger.warn('Google Sheets credentials or ID not provided. Sync will fail.');
                return;
            }

            // Determine if it's a file path or JSON string
            let authOptions: any = {
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            };

            if (keyFileOrString.trim().startsWith('{')) {
                authOptions.credentials = JSON.parse(keyFileOrString);
            } else {
                authOptions.keyFile = keyFileOrString;
            }

            const auth = new google.auth.GoogleAuth(authOptions);
            const authClient = await auth.getClient();
            this.sheetsClient = google.sheets({ version: 'v4', auth: authClient as any });
            this.spreadsheetId = sheetId;
            this.logger.log('Google Sheets client initialized.');
        } catch (error) {
            this.logger.error('Failed to initialize Google Sheets client', error);
        }
    }

    async process(job: Job<any, any, string>): Promise<any> {
        if (!this.sheetsClient) {
            // Retry logic might be needed here or just fail
            throw new Error('Google Sheets client not ready');
        }

        this.logger.log(`Processing sync job ${job.id} for ${job.data.name}`);

        const { name, attendanceChoice, attendanceStatus, note, timestamp } = job.data;

        try {
            await this.sheetsClient.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Sheet1!A:E', // Assumes Sheet1
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [name, attendanceChoice, attendanceStatus, note || '', timestamp]
                    ],
                },
            });
            this.logger.log(`Synced RSVP for ${name} to Sheets.`);
        } catch (error) {
            this.logger.error(`Failed to sync to Sheets`, error);
            throw error; // Trigger BullMQ retry
        }
    }
}
