import { Controller, Post, Get, Body, Query, UseGuards, Request, Res, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Response } from 'express';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('login')
    async login(@Body() body: { username: string; password: string }) {
        return this.adminService.login(body.username, body.password);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('guests')
    async getGuests(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ) {
        return this.adminService.getGuests(parseInt(page), parseInt(limit), search);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('guests')
    async createGuest(@Body() body: { name: string; attendanceStatus: string; attendanceChoice: string; note?: string }, @Request() req: any) {
        return this.adminService.createGuestManually(body, req.user.username);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('guests/:id')
    async updateGuest(@Param('id') id: string, @Body() body: { attendanceStatus?: string; attendanceChoice?: string; isCheckedIn?: boolean; note?: string }, @Request() req: any) {
        return this.adminService.updateGuest(id, body, req.user.username);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('checkin/scan')
    async checkInByQR(@Body() body: { qrData: string }, @Request() req: any) {
        return this.adminService.checkInByQR(body.qrData, req.user.username);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('guests/export')
    async exportGuests(@Res() res: Response) {
        const buffer = await this.adminService.exportToExcel();
        const filename = `wedding-guests-${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
}
