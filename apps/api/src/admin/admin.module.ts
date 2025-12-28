import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtStrategy } from './jwt.strategy';
import { Rsvp, RsvpSchema } from '../rsvp/schemas/rsvp.schema';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-jwt-secret',
                signOptions: { expiresIn: '24h' },
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([{ name: Rsvp.name, schema: RsvpSchema }]),
    ],
    controllers: [AdminController],
    providers: [AdminService, JwtStrategy],
})
export class AdminModule { }
