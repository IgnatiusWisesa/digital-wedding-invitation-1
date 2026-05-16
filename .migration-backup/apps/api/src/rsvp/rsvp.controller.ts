import { Controller, Post, Body, Get } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('rsvp')
export class RsvpController {
    constructor(private readonly rsvpService: RsvpService) { }

    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Rate limit: 5 requests per minute
    @Post()
    async create(@Body() createRsvpDto: CreateRsvpDto) {
        return this.rsvpService.createOrUpdate(createRsvpDto);
    }

    @Throttle({ default: { limit: 20, ttl: 60000 } })
    @Get('wishes')
    async getWishes() {
        return this.rsvpService.getWishes();
    }
}
