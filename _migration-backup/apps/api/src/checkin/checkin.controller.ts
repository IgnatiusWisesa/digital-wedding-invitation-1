import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('checkin')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) { }

    @Post()
    @UseGuards(ApiKeyGuard)
    async checkIn(@Body('token') token: string, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.checkinService.checkIn(token, ip, userAgent);
    }
}
