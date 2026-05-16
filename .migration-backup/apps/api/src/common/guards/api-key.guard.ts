import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        // Check minimal checkin key or admin key
        const checkinKey = this.configService.get<string>('CHECKIN_API_KEY');
        const adminKey = this.configService.get<string>('ADMIN_API_KEY');

        if (apiKey === checkinKey || apiKey === adminKey) {
            // Optionally attach usage role to request
            request['userRole'] = apiKey === adminKey ? 'admin' : 'checkin';
            return true;
        }

        throw new UnauthorizedException('Invalid API Key');
    }
}
