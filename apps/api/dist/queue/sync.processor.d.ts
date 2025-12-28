import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare class SyncProcessor extends WorkerHost {
    private configService;
    private readonly logger;
    private sheetsClient;
    private spreadsheetId;
    constructor(configService: ConfigService);
    private initGoogleClient;
    process(job: Job<any, any, string>): Promise<any>;
}
